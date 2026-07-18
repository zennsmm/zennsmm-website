import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { SMM_API_URL, SMM_API_KEY, SMMZIOService } from '@/lib/api-client';

const CACHE_MINUTES = 15;

export async function POST() {
  try {
    const { db } = initializeFirebase();
    
    // Performance: Check cache lock to prevent excessive external API calls
    const cacheRef = doc(db, 'system_metadata', 'services_sync');
    const cacheSnap = await getDoc(cacheRef);
    
    if (cacheSnap.exists()) {
      const lastSync = cacheSnap.data().lastSync as Timestamp;
      const diffMs = Date.now() - lastSync.toMillis();
      const diffMins = diffMs / (1000 * 60);
      
      if (diffMins < CACHE_MINUTES) {
        return NextResponse.json({ 
          success: true, 
          message: 'Cache is fresh', 
          nextSyncIn: Math.ceil(CACHE_MINUTES - diffMins) 
        });
      }
    }

    console.log('[Sync] Cache expired or missing. Fetching from SMMZIO...');
    const response = await fetch(`${SMM_API_URL}?key=${SMM_API_KEY}&action=services`, {
      next: { revalidate: 900 } // Next.js level fetch caching
    });
    
    if (!response.ok) {
      throw new Error(`Provider API returned HTTP status: ${response.status}`);
    }

    const data = await response.json();
    if (data && typeof data === 'object' && data.error) {
      throw new Error(`Provider API Error: ${data.error}`);
    }

    const services: SMMZIOService[] = Array.isArray(data) ? data : [];
    if (services.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const categories = new Set<string>();
    const syncPromises = services.map(async (s) => {
      if (s.category) categories.add(s.category);
      const serviceIdStr = s.service.toString();
      const serviceRef = doc(db, 'services', serviceIdStr);
      
      return setDoc(serviceRef, {
        serviceId: serviceIdStr,
        name: s.name || 'Unnamed Service',
        category: s.category || 'Uncategorized',
        rate: s.rate || '0',
        min: s.min || '0',
        max: s.max || '0',
        type: s.type || 'Default',
        refill: s.refill === true || String(s.refill) === "1" || String(s.refill) === "true",
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    await Promise.all(syncPromises);

    // Update sync lock
    await setDoc(cacheRef, {
      lastSync: serverTimestamp(),
      count: services.length,
      categories: categories.size
    });

    return NextResponse.json({ 
      success: true, 
      count: services.length, 
      categories: categories.size 
    });
  } catch (err: any) {
    console.error('[Sync Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
