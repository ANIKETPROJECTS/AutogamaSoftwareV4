import { WhatsAppTemplate, type JobStage, type CustomerStatus } from './models';

const STATUS_MESSAGES: Record<CustomerStatus, string> = {
  'Inquired': 'Thank you for your inquiry! We have received your service request for {{service}}. Our team will contact you shortly.',
  'Working': 'Work has started on your vehicle for {{service}}. We will keep you updated on the progress.',
  'Waiting': 'Your vehicle service ({{service}}) is currently on hold. We will notify you once we resume work.',
  'Completed': 'Great news! Your {{service}} service has been completed. Please visit us to collect your vehicle.'
};

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    console.log(`[WhatsApp] API not configured. Message: ${phone}: ${message}`);
    return false;
  }
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: message }
      })
    });
    
    if (response.ok) {
      console.log(`[WhatsApp] Message sent to ${phone}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`[WhatsApp] Failed to send message: ${error}`);
      return false;
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return false;
  }
}

export async function sendCustomerStatusUpdate(phone: string, status: CustomerStatus, service?: string): Promise<boolean> {
  const messageTemplate = STATUS_MESSAGES[status];
  if (!messageTemplate) {
    console.log(`[WhatsApp] No template for status: ${status}`);
    return false;
  }
  
  const message = messageTemplate.replace(/\{\{service\}\}/g, service || 'your vehicle');
  return sendWhatsAppMessage(phone, message);
}

export async function sendStageUpdateMessage(phone: string, stage: JobStage, vehicleName: string, plateNumber: string): Promise<boolean> {
  try {
    const template = await WhatsAppTemplate.findOne({ stage, isActive: true });
    
    if (!template) {
      console.log(`[WhatsApp] No active template found for stage: ${stage}`);
      return false;
    }

    const message = template.message
      .replace('{{vehicle}}', vehicleName)
      .replace('{{plate}}', plateNumber);

    return sendWhatsAppMessage(phone, message);
  } catch (error) {
    console.error('[WhatsApp] Error sending stage update:', error);
    return false;
  }
}

export async function initializeWhatsAppTemplates(): Promise<void> {
  const defaultTemplates = [
    { stage: 'New Lead' as JobStage, message: 'Welcome! Your {{vehicle}} ({{plate}}) has been registered. We will contact you shortly.' },
    { stage: 'Inspection Done' as JobStage, message: 'Inspection completed for your {{vehicle}} ({{plate}}). Our team will share the report soon.' },
    { stage: 'Work In Progress' as JobStage, message: 'Work has started on your {{vehicle}} ({{plate}}). We will keep you updated.' },
    { stage: 'Completed' as JobStage, message: 'Great news! Your {{vehicle}} ({{plate}}) is ready for pickup. Please visit us at your convenience.' },
    { stage: 'Cancelled' as JobStage, message: 'Your service request for {{vehicle}} ({{plate}}) has been cancelled. Contact us for any queries.' }
  ];

  for (const template of defaultTemplates) {
    await WhatsAppTemplate.findOneAndUpdate(
      { stage: template.stage },
      template,
      { upsert: true }
    );
  }
  
  console.log('[WhatsApp] Templates initialized');
}
