
export default function RefundPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="font-headline text-4xl font-bold mb-8">Refund Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>Thank you for choosing zennsmm. We want to ensure you have a clear understanding of our refund procedures.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Refund Eligibility</h2>
        <p>Refunds are only processed if a service is not delivered within the specified timeframe or if there is a technical error on our platform. No refunds will be issued once an order has been successfully completed or is in progress.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Non-Refundable Scenarios</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>If the user's social media profile is set to "Private" during the delivery process.</li>
          <li>If the link provided is incorrect or broken.</li>
          <li>If you use multiple SMM panels for the same link at the same time.</li>
          <li>Partial drops after the guarantee period has expired.</li>
        </ul>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Refund Process</h2>
        <p>To request a refund, please contact our support team at support@zennsmm.com with your order ID and the reason for the request. All refund requests are reviewed within 48-72 hours. If approved, the refund will be credited back to your zennsmm account balance or your original payment method within 5-7 business days.</p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Dispute Policy</h2>
        <p>You agree that once you complete a payment, you will not file a dispute or a chargeback against us for any reason. If you file a dispute or chargeback against us after a deposit, we reserve the right to terminate all future orders and ban you from our site.</p>

        <p className="mt-12 text-sm italic">Last updated: October 2023</p>
      </div>
    </div>
  );
}
