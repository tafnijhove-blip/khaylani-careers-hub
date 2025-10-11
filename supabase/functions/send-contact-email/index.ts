import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  naam: string;
  bedrijfsnaam: string;
  email: string;
  aantalMedewerkers: string;
  bericht: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { naam, bedrijfsnaam, email, aantalMedewerkers, bericht }: ContactRequest = await req.json();

    // Send notification email to Khaylani
    const notificationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Khaylani <onboarding@resend.dev>",
        to: ["info@khaylani.nl"],
        subject: `Nieuwe offerte aanvraag van ${bedrijfsnaam}`,
        html: `
          <h2>Nieuwe offerte aanvraag</h2>
          <p><strong>Naam:</strong> ${naam}</p>
          <p><strong>Bedrijfsnaam:</strong> ${bedrijfsnaam}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Aantal medewerkers:</strong> ${aantalMedewerkers}</p>
          <p><strong>Bericht:</strong></p>
          <p>${bericht}</p>
        `,
      }),
    });

    if (!notificationResponse.ok) {
      const error = await notificationResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    // Send confirmation email to customer
    const confirmationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Khaylani <onboarding@resend.dev>",
        to: [email],
        subject: "Bedankt voor je interesse in Khaylani",
        html: `
          <h1>Bedankt voor je interesse, ${naam}!</h1>
          <p>We hebben je offerte aanvraag ontvangen en nemen binnen 24 uur contact met je op.</p>
          <h2>Je aanvraag details:</h2>
          <ul>
            <li><strong>Bedrijf:</strong> ${bedrijfsnaam}</li>
            <li><strong>Aantal medewerkers:</strong> ${aantalMedewerkers}</li>
          </ul>
          <p>Heb je nog vragen? Mail ons op info@khaylani.nl</p>
          <p>Met vriendelijke groet,<br>Team Khaylani</p>
        `,
      }),
    });

    if (!confirmationResponse.ok) {
      console.error("Failed to send confirmation email, but notification was sent");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Emails verzonden" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
