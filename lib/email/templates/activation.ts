export function activationEmail(activationUrl: string): {
    subject: string;
    text: string;
    html: string;
} {
    return {
        subject: "Aktivera ditt konto",
        text: `Hej!\n\nKlicka på länken nedan för att aktivera ditt konto:\n\n${activationUrl}\n\nLänken är giltig i 24 timmar.\n\nOm du inte skapat ett konto kan du ignorera detta meddelande.`,
        html: `
<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.25rem;">Aktivera ditt konto</h1>
  <p>Klicka på knappen nedan för att aktivera ditt konto. Länken är giltig i 24 timmar.</p>
  <a href="${activationUrl}"
     style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
    Aktivera konto
  </a>
  <p style="color:#666;font-size:0.875rem;">
    Om du inte skapat ett konto kan du ignorera detta meddelande.<br>
    Länk: ${activationUrl}
  </p>
</body>
</html>`,
    };
}
