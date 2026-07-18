
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="font-headline text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>At zennsmm, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Information We Collect</h2>
        <p>When you use our services, we collect information you provide directly to us, such as when you create an account, make a purchase, or communicate with us. This may include your name, email address, payment information, and social media handles related to your orders.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide, maintain, and improve our SMM services.</li>
          <li>To process transactions and send related information, including confirmations and receipts.</li>
          <li>To respond to your comments, questions, and customer service requests.</li>
          <li>To communicate with you about products, services, and promotions offered by zennsmm.</li>
        </ul>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Security of Your Data</h2>
        <p>We implement appropriate technical and organizational measures to protect the security of your personal data. We use industry-standard encryption protocols (SSL) and secure payment gateways like Razorpay to ensure your sensitive information is safe.</p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Cookie Policy</h2>
        <p>We use cookies to enhance your experience on our website. Cookies are small files stored on your device that help us remember your preferences and understand how you interact with our platform.</p>

        <p className="mt-12 text-sm italic">Last updated: October 2023</p>
      </div>
    </div>
  );
}
