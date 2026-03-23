import { readFileSync } from 'fs';
import { join } from 'path';

export const welcome = {
  en: "Hi, welcome to Pictalk! Paste the code on the Pictalk AAC app to validate your account.",
  fr: "Bonjour, bienvenue sur Pictalk ! Collez le code sur l'application Pictalk AAC pour valider votre compte.",
  es: "¡Hola, bienvenido a Pictalk! Pega el código en la aplicación Pictalk AAC para validar tu cuenta.",
  it: "Ciao, benvenuto su Pictalk! Incolla il codice sull'app Pictalk AAC per convalidare il tuo account.",
  de: "Hallo, willkommen bei Pictalk! Füge den Code in die Pictalk AAC-App ein, um dein Konto zu validieren.",
  ro: "Bună, bun venit la Pictalk! Copiază codul în aplicația Pictalk AAC pentru a-ți valida contul.",
  po: "Cześć, witaj w Pictalk! Wklej kod w aplikacji Pictalk AAC, aby zweryfikować swoje konto.",
  el: "Γεια σας, καλώς ήρθατε στο Pictalk! Επικολλήστε τον κωδικό στην εφαρμογή Pictalk AAC για να επικυρώσετε τον λογαριασμό σας.",
  pt: "Olá, bem-vindo ao Pictalk! Cole o código no aplicativo Pictalk AAC para validar sua conta.",
  ar: "مرحباً، أهلاً بك في Pictalk! الصق الرمز على تطبيق Pictalk AAC للتحقق من حسابك.",
  sv: "Hej, välkommen till Pictalk! Klistra in koden i Pictalk AAC-appen för att validera ditt konto.",
  nl: "Hallo, welkom bij Pictalk! Plak de code in de Pictalk AAC-app om je account te valideren.",
  fi: "Hei, tervetuloa Pictalkiin! Liitä koodi Pictalk AAC -sovellukseen vahvistaaksesi tilisi."
}

export const validAccount = {
  en: "Your account is now valid, you can now log in",
  fr: "Votre compte est maintenant valide, vous pouvez vous connecter",
  es: "Su cuenta ya es válida, ahora puede iniciar sesión",
  it: "Il tuo account è ora valido, puoi accedere",
  de: "Ihr Konto ist jetzt gültig, Sie können sich jetzt anmelden",
  ro: "Contul dvs. este acum valid, vă puteți conecta",
  po: "Sua conta agora é válida, você pode fazer login",
  el: "Ο λογαριασμός σας είναι πλέον έγκυρος, μπορείτε να συνδεθείτε",
  pt: "A sua conta Pictalk já é válida, pode agora iniciar sessão.",
  ar: "حسابك صالح الآن، يمكنك تسجيل الدخول",
  sv: "Ditt konto är nu giltigt, du kan nu logga in",
  nl: "Uw account is nu geldig, u kunt nu inloggen",
  fi: "Tilisi on nyt voimassa, voit nyt kirjautua sisään"
}

export const resetPassword = {
  en: "Reset your Pictalk password",
  fr: "Réinitialisez votre mot de passe Pictalk",
  es: "Restablece tu contraseña de Pictalk",
  it: "Reimposta la tua password Pictalk",
  de: "Pictalk-Passwort zurücksetzen",
  ro: "Resetează parola ta Pictalk",
  po: "Redefina a sua palavra-passe Pictalk",
  el: "Επαναφορά κωδικού πρόσβασης Pictalk",
  pt: "Redefinir a sua senha Pictalk",
  ar: "إعادة تعيين كلمة مرور Pictalk",
  sv: "Återställ ditt Pictalk-lösenord",
  nl: "Pictalk-wachtwoord opnieuw instellen",
  fi: "Nollaa Pictalk-salasanasi"
}

export const changedPassword = {
  en: "Your Pictalk password has been changed",
  fr: "Votre mot de passe Pictalk a été modifié",
  es: "Tu contraseña de Pictalk ha sido cambiada",
  it: "La tua password Pictalk è stata modificata",
  de: "Dein Pictalk-Passwort wurde geändert",
  ro: "Parola ta Pictalk a fost schimbată",
  po: "A sua palavra-passe Pictalk foi alterada",
  el: "Ο κωδικός πρόσβασης Pictalk άλλαξε",
  pt: "A sua senha Pictalk foi alterada",
  ar: "تم تغيير كلمة مرور Pictalk",
  sv: "Ditt Pictalk-lösenord har ändrats",
  nl: "Uw Pictalk-wachtwoord is gewijzigd",
  fi: "Pictalk-salasanasi on vaihdettu"
}

// --- Email template builder ---

function buildEmailHtml(emailTitle: string, body: string): string {
  const template = readFileSync(join(__dirname, '../auth/email_base.html'), 'utf8');
  return template
    .replace('{{ .EmailTitle }}', emailTitle)
    .replace('{{ .Body }}', body);
}

function tokenBox(token: string): string {
  return `<div style="background-color:#f0f7ff;border:2px solid #1188E6;border-radius:8px;padding:24px 16px;margin:20px 0;text-align:center;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1188E6;font-family:'Courier New',Courier,monospace;">${token}</span>
      </div>`;
}

export function buildSignupEmail(lang: string, token: string): { subject: string; html: string } {
  const welcomeMsg = welcome[lang] ?? welcome.en;
  const validAccountMsg = validAccount[lang] ?? validAccount.en;
  const isVerified = token === 'verified';

  const body = isVerified
    ? `<p style="margin:0 0 16px;font-size:16px;color:#333;">${validAccountMsg}</p>`
    : `<p style="margin:0 0 16px;font-size:16px;color:#333;">${welcomeMsg}</p>
      ${tokenBox(token)}
      <p style="margin:16px 0 0;font-size:12px;color:#999;">If you did not create a Pictalk account, you can safely ignore this email.</p>`;

  return {
    subject: welcomeMsg,
    html: buildEmailHtml('Welcome to Pictalk', body),
  };
}

export function buildResetPasswordEmail(lang: string, token: string): { subject: string; html: string } {
  const resetMsg = resetPassword[lang] ?? resetPassword.en;

  const body = `<p style="margin:0 0 20px;font-size:16px;color:#333;">${resetMsg}</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://application.pictalk.org/resetpassword?token=${token}"
           target="_blank"
           style="background-color:#1188E6;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          ${resetMsg}
        </a>
      </div>
      <p style="margin:16px 0 8px;font-size:13px;color:#555;">You can also copy the code below:</p>
      ${tokenBox(token)}
      <p style="margin:16px 0 0;font-size:12px;color:#999;">If you did not request a password reset, you can safely ignore this email.</p>`;

  return {
    subject: resetMsg,
    html: buildEmailHtml(resetMsg, body),
  };
}

export function buildChangedPasswordEmail(lang: string): { subject: string; html: string } {
  const changedMsg = changedPassword[lang] ?? changedPassword.en;

  const body = `<p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#4caf50;">${changedMsg}</p>
      <p style="margin:0 0 16px;color:#555;">You can now log in with your new password.</p>
      <p style="margin:0;font-size:12px;color:#999;">If you did not change your password, please contact us immediately.</p>`;

  return {
    subject: changedMsg,
    html: buildEmailHtml(changedMsg, body),
  };
}