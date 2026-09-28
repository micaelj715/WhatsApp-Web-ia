// Textos do cadastro e do painel do cliente em 4 idiomas
window.I18N = {
pt: {
  login:"Entrar", signup:"Criar conta", email:"E-mail", password:"Senha", passHint:"Mínimo de 8 caracteres", name:"Seu nome",
  business:"Nome do negócio", niche:"Tipo de negócio", country:"País", lang:"Idioma", currency:"Moeda", plan:"Plano",
  createAccount:"Criar conta e começar o teste", enter:"Entrar", haveAccount:"Já tenho conta", noAccount:"Ainda não tenho conta",
  trialNote:"7 dias grátis. Não pedimos cartão.", backSite:"Voltar ao site",
  niches:{clinica:"Clínica / dentista", salao:"Salão / barbearia", restaurante:"Restaurante / delivery", imobiliaria:"Imobiliária", outro:"Outro"},
  plans:{ess:"Essencial", pro:"Profissional", com:"Completo"}, month:"/mês", perMonth:"{n} respostas por mês",
  err:{invalid_email:"Confira o e-mail.", weak_password:"A senha precisa ter pelo menos 8 caracteres.", missing_business:"Escreva o nome do negócio.",
    email_taken:"Já existe uma conta com esse e-mail. Use Entrar.", wrong_login:"E-mail ou senha incorretos.", wrong_password:"A senha atual está incorreta.",
    too_many_attempts:"Muitas tentativas. Espere alguns minutos.", already_claimed:"Você já avisou um pagamento. Aguarde a confirmação.",
    suspended:"Conta suspensa. Fale com o suporte.", generic:"Algo deu errado. Tente de novo.", offline:"Sem conexão com o servidor."},
  nav:{home:"Início", wa:"WhatsApp", bot:"Atendente", test:"Testar", chats:"Conversas", plan:"Plano", account:"Conta"}, logout:"Sair",
  hello:"Olá, {name}", stTrial:"Teste grátis até {d}", stActive:"Plano ativo até {d}",
  stExpired:"Seu período acabou. Pague o plano para o atendente voltar a responder.", stSuspended:"Conta suspensa. Fale com o suporte.",
  cWa:"WhatsApp", waOn:"Conectado · +{n}", waOff:"Não conectado", waQr:"Esperando leitura do QR code", waConnecting:"Conectando…",
  cUsage:"Respostas este mês", cBot:"Atendente", botOn:"Ligado", botOff:"Desligado", turnOn:"Ligar", turnOff:"Desligar",
  steps:"Primeiros passos", s1:"Conecte seu WhatsApp", s2:"Escreva as informações do negócio", s3:"Teste o atendente", s4:"Pague o plano antes do fim do teste",
  waTitle:"Conectar seu WhatsApp", waHow:["Abra o WhatsApp no celular do negócio.","Android: toque em ⋮ > Aparelhos conectados. iPhone: Configurações > Aparelhos conectados.","Toque em Conectar um aparelho e aponte a câmera para o código ao lado."],
  genQr:"Gerar QR code", qrWait:"Gerando o código…", qrStopped:"O código expirou. Gere outro quando estiver com o celular na mão.",
  waDone:"Seu WhatsApp está conectado. O atendente já responde seus clientes.", disconnect:"Desconectar WhatsApp", confirm:"Clique de novo para confirmar",
  waNote:"Seu celular continua funcionando normalmente. Quando você responde uma conversa, o atendente fica calado nela pelo tempo que você definir.",
  waRisk:"Esta conexão usa o mesmo método do WhatsApp Web. Não use o atendente para mandar mensagens em massa, para evitar bloqueio do número.",
  botTitle:"Configurar o atendente", info:"Informações do negócio",
  infoHint:"Escreva tudo que o atendente precisa saber. Ele só responde com o que estiver aqui.",
  infoPh:"Horário: segunda a sexta, 9h às 18h; sábado, 9h às 13h\nEndereço: Rua ..., perto de ...\nServiços e preços:\n- Serviço A: ...\n- Serviço B: ...\nFormas de pagamento: ...\nEntrega / agendamento: como funciona\nPerguntas frequentes:\n- ...",
  tone:"Jeito de falar", tones:{amigavel:"Simpático", formal:"Formal", descontraido:"Descontraído"}, mainLang:"Idioma principal",
  instr:"Instruções extras (opcional)", instrPh:"Ex.: sempre ofereça o horário livre mais próximo. Não fale de descontos.",
  notify:"Mandar para o meu WhatsApp um resumo de cada pedido, agendamento ou pedido para falar comigo",
  media:"Quando o cliente mandar áudio ou foto, pedir para escrever", pause:"Quando eu responder uma conversa, o atendente fica calado nela por", minutes:"minutos",
  save:"Salvar", saved:"Salvo", testTitle:"Testar o atendente", testHint:"Converse como se fosse um cliente. O teste não usa seu WhatsApp nem as respostas do plano.",
  testPh:"Escreva como um cliente…", send:"Enviar", reset:"Recomeçar", notifyPreview:"Aviso que chegaria no seu WhatsApp:",
  aiBusy:"O atendente está ocupado. Tente de novo em alguns segundos.", aiOff:"A IA ainda não foi configurada no servidor.",
  chatsTitle:"Conversas", chatsEmpty:"As conversas aparecem aqui quando seus clientes escreverem.", pausedTag:"atendente pausado",
  pause1h:"Pausar atendente nesta conversa (1h)", resume:"Reativar atendente nesta conversa", you:"Você", botName:"Atendente", back:"Voltar",
  planTitle:"Seu plano", current:"Atual", choose:"Escolher", payTitle:"Pagamento",
  payText:"Pague {amount} pelo PayPal (cartão de crédito ou saldo). Depois clique em “Já paguei”. O plano ativa assim que confirmarmos.",
  cveNote:"O PayPal não aceita escudos, então o valor é cobrado em euros.", payBtn:"Pagar com PayPal", paidBtn:"Já paguei",
  paidNote:"Nome ou e-mail usado no PayPal (opcional)", claimed:"Recebemos seu aviso. Vamos confirmar o pagamento em breve.",
  noPaypal:"O pagamento online ainda não está disponível. Fale com o suporte.", renew:"O plano é mensal. Pague de novo antes de {d} para não parar.",
  support:"Suporte no WhatsApp", accTitle:"Conta", changePass:"Trocar senha", curPass:"Senha atual", newPass:"Nova senha", passChanged:"Senha trocada",
  uiLang:"Idioma do painel"
},
en: {
  login:"Log in", signup:"Create account", email:"Email", password:"Password", passHint:"At least 8 characters", name:"Your name",
  business:"Business name", niche:"Type of business", country:"Country", lang:"Language", currency:"Currency", plan:"Plan",
  createAccount:"Create account and start trial", enter:"Log in", haveAccount:"I already have an account", noAccount:"I don't have an account yet",
  trialNote:"7 days free. No card required.", backSite:"Back to website",
  niches:{clinica:"Clinic / dentist", salao:"Salon / barber", restaurante:"Restaurant / delivery", imobiliaria:"Real estate", outro:"Other"},
  plans:{ess:"Essential", pro:"Professional", com:"Complete"}, month:"/month", perMonth:"{n} replies per month",
  err:{invalid_email:"Check the email address.", weak_password:"The password needs at least 8 characters.", missing_business:"Enter the business name.",
    email_taken:"An account with this email already exists. Use Log in.", wrong_login:"Wrong email or password.", wrong_password:"The current password is wrong.",
    too_many_attempts:"Too many attempts. Wait a few minutes.", already_claimed:"You already reported a payment. Please wait for confirmation.",
    suspended:"Account suspended. Contact support.", generic:"Something went wrong. Try again.", offline:"Can't reach the server."},
  nav:{home:"Home", wa:"WhatsApp", bot:"Assistant", test:"Test", chats:"Chats", plan:"Plan", account:"Account"}, logout:"Log out",
  hello:"Hi, {name}", stTrial:"Free trial until {d}", stActive:"Plan active until {d}",
  stExpired:"Your period has ended. Pay for your plan so the assistant replies again.", stSuspended:"Account suspended. Contact support.",
  cWa:"WhatsApp", waOn:"Connected · +{n}", waOff:"Not connected", waQr:"Waiting for QR scan", waConnecting:"Connecting…",
  cUsage:"Replies this month", cBot:"Assistant", botOn:"On", botOff:"Off", turnOn:"Turn on", turnOff:"Turn off",
  steps:"Getting started", s1:"Connect your WhatsApp", s2:"Write your business information", s3:"Test the assistant", s4:"Pay for your plan before the trial ends",
  waTitle:"Connect your WhatsApp", waHow:["Open WhatsApp on the business phone.","Android: tap ⋮ > Linked devices. iPhone: Settings > Linked devices.","Tap Link a device and point the camera at the code."],
  genQr:"Generate QR code", qrWait:"Generating code…", qrStopped:"The code expired. Generate a new one when you have your phone at hand.",
  waDone:"Your WhatsApp is connected. The assistant is already replying to your customers.", disconnect:"Disconnect WhatsApp", confirm:"Click again to confirm",
  waNote:"Your phone keeps working as usual. When you reply to a chat, the assistant stays quiet in it for the time you choose.",
  waRisk:"This connection uses the same method as WhatsApp Web. Don't use the assistant for bulk messages, to avoid getting the number banned.",
  botTitle:"Set up the assistant", info:"Business information",
  infoHint:"Write everything the assistant needs to know. It only answers with what's written here.",
  infoPh:"Hours: Monday to Friday, 9:00–18:00; Saturday 9:00–13:00\nAddress: ...\nServices and prices:\n- Service A: ...\n- Service B: ...\nPayment methods: ...\nDelivery / booking: how it works\nFAQ:\n- ...",
  tone:"Tone of voice", tones:{amigavel:"Friendly", formal:"Formal", descontraido:"Casual"}, mainLang:"Main language",
  instr:"Extra instructions (optional)", instrPh:"E.g. always offer the next free slot. Don't talk about discounts.",
  notify:"Send a summary of each order, booking or request to talk to me to my WhatsApp",
  media:"When a customer sends audio or a photo, ask them to type", pause:"When I reply to a chat, the assistant stays quiet in it for", minutes:"minutes",
  save:"Save", saved:"Saved", testTitle:"Test the assistant", testHint:"Chat as if you were a customer. Tests don't use your WhatsApp or your plan's replies.",
  testPh:"Write like a customer…", send:"Send", reset:"Start over", notifyPreview:"Alert you would get on WhatsApp:",
  aiBusy:"The assistant is busy. Try again in a few seconds.", aiOff:"AI is not configured on the server yet.",
  chatsTitle:"Chats", chatsEmpty:"Chats show up here when your customers write.", pausedTag:"assistant paused",
  pause1h:"Pause assistant in this chat (1h)", resume:"Resume assistant in this chat", you:"You", botName:"Assistant", back:"Back",
  planTitle:"Your plan", current:"Current", choose:"Choose", payTitle:"Payment",
  payText:"Pay {amount} with PayPal (credit card or balance). Then click “I've paid”. Your plan activates once we confirm it.",
  cveNote:"PayPal doesn't accept escudos, so the amount is charged in euros.", payBtn:"Pay with PayPal", paidBtn:"I've paid",
  paidNote:"Name or email used on PayPal (optional)", claimed:"We got your notice. We'll confirm the payment shortly.",
  noPaypal:"Online payment isn't available yet. Contact support.", renew:"The plan is monthly. Pay again before {d} to keep it running.",
  support:"Support on WhatsApp", accTitle:"Account", changePass:"Change password", curPass:"Current password", newPass:"New password", passChanged:"Password changed",
  uiLang:"Dashboard language"
},
fr: {
  login:"Se connecter", signup:"Créer un compte", email:"E-mail", password:"Mot de passe", passHint:"8 caractères minimum", name:"Votre nom",
  business:"Nom du commerce", niche:"Type d'activité", country:"Pays", lang:"Langue", currency:"Monnaie", plan:"Offre",
  createAccount:"Créer le compte et commencer l'essai", enter:"Se connecter", haveAccount:"J'ai déjà un compte", noAccount:"Je n'ai pas encore de compte",
  trialNote:"7 jours gratuits. Sans carte bancaire.", backSite:"Retour au site",
  niches:{clinica:"Clinique / dentiste", salao:"Salon / barbier", restaurante:"Restaurant / livraison", imobiliaria:"Immobilier", outro:"Autre"},
  plans:{ess:"Essentiel", pro:"Professionnel", com:"Complet"}, month:"/mois", perMonth:"{n} réponses par mois",
  err:{invalid_email:"Vérifiez l'adresse e-mail.", weak_password:"Le mot de passe doit avoir au moins 8 caractères.", missing_business:"Indiquez le nom du commerce.",
    email_taken:"Un compte existe déjà avec cet e-mail. Connectez-vous.", wrong_login:"E-mail ou mot de passe incorrect.", wrong_password:"Le mot de passe actuel est incorrect.",
    too_many_attempts:"Trop de tentatives. Attendez quelques minutes.", already_claimed:"Vous avez déjà signalé un paiement. Attendez la confirmation.",
    suspended:"Compte suspendu. Contactez le support.", generic:"Un problème est survenu. Réessayez.", offline:"Impossible de joindre le serveur."},
  nav:{home:"Accueil", wa:"WhatsApp", bot:"Assistant", test:"Tester", chats:"Conversations", plan:"Offre", account:"Compte"}, logout:"Se déconnecter",
  hello:"Bonjour, {name}", stTrial:"Essai gratuit jusqu'au {d}", stActive:"Offre active jusqu'au {d}",
  stExpired:"Votre période est terminée. Payez votre offre pour que l'assistant réponde à nouveau.", stSuspended:"Compte suspendu. Contactez le support.",
  cWa:"WhatsApp", waOn:"Connecté · +{n}", waOff:"Non connecté", waQr:"En attente du scan du QR code", waConnecting:"Connexion…",
  cUsage:"Réponses ce mois-ci", cBot:"Assistant", botOn:"Activé", botOff:"Désactivé", turnOn:"Activer", turnOff:"Désactiver",
  steps:"Premiers pas", s1:"Connectez votre WhatsApp", s2:"Écrivez les informations du commerce", s3:"Testez l'assistant", s4:"Payez l'offre avant la fin de l'essai",
  waTitle:"Connecter votre WhatsApp", waHow:["Ouvrez WhatsApp sur le téléphone du commerce.","Android : ⋮ > Appareils connectés. iPhone : Réglages > Appareils connectés.","Touchez Connecter un appareil et visez le code."],
  genQr:"Générer le QR code", qrWait:"Génération du code…", qrStopped:"Le code a expiré. Générez-en un autre quand vous avez le téléphone en main.",
  waDone:"Votre WhatsApp est connecté. L'assistant répond déjà à vos clients.", disconnect:"Déconnecter WhatsApp", confirm:"Cliquez encore pour confirmer",
  waNote:"Votre téléphone fonctionne normalement. Quand vous répondez à une conversation, l'assistant s'y tait pendant la durée choisie.",
  waRisk:"Cette connexion utilise la même méthode que WhatsApp Web. N'utilisez pas l'assistant pour des envois en masse, pour éviter le blocage du numéro.",
  botTitle:"Configurer l'assistant", info:"Informations du commerce",
  infoHint:"Écrivez tout ce que l'assistant doit savoir. Il ne répond qu'avec ce qui est écrit ici.",
  infoPh:"Horaires : lundi à vendredi, 9h–18h ; samedi 9h–13h\nAdresse : ...\nServices et prix :\n- Service A : ...\n- Service B : ...\nMoyens de paiement : ...\nLivraison / rendez-vous : fonctionnement\nQuestions fréquentes :\n- ...",
  tone:"Ton", tones:{amigavel:"Chaleureux", formal:"Formel", descontraido:"Décontracté"}, mainLang:"Langue principale",
  instr:"Instructions supplémentaires (facultatif)", instrPh:"Ex. : proposez toujours le prochain créneau libre. Ne parlez pas de remises.",
  notify:"M'envoyer sur WhatsApp un résumé de chaque commande, rendez-vous ou demande de me parler",
  media:"Quand un client envoie un audio ou une photo, lui demander d'écrire", pause:"Quand je réponds à une conversation, l'assistant s'y tait pendant", minutes:"minutes",
  save:"Enregistrer", saved:"Enregistré", testTitle:"Tester l'assistant", testHint:"Discutez comme un client. Le test n'utilise ni votre WhatsApp ni les réponses de l'offre.",
  testPh:"Écrivez comme un client…", send:"Envoyer", reset:"Recommencer", notifyPreview:"Alerte que vous recevriez sur WhatsApp :",
  aiBusy:"L'assistant est occupé. Réessayez dans quelques secondes.", aiOff:"L'IA n'est pas encore configurée sur le serveur.",
  chatsTitle:"Conversations", chatsEmpty:"Les conversations apparaissent ici quand vos clients écrivent.", pausedTag:"assistant en pause",
  pause1h:"Mettre l'assistant en pause ici (1h)", resume:"Réactiver l'assistant ici", you:"Vous", botName:"Assistant", back:"Retour",
  planTitle:"Votre offre", current:"Actuelle", choose:"Choisir", payTitle:"Paiement",
  payText:"Payez {amount} avec PayPal (carte bancaire ou solde). Puis cliquez sur « J'ai payé ». L'offre s'active dès notre confirmation.",
  cveNote:"PayPal n'accepte pas l'escudo, le montant est donc débité en euros.", payBtn:"Payer avec PayPal", paidBtn:"J'ai payé",
  paidNote:"Nom ou e-mail utilisé sur PayPal (facultatif)", claimed:"Nous avons reçu votre signalement. Nous confirmerons le paiement rapidement.",
  noPaypal:"Le paiement en ligne n'est pas encore disponible. Contactez le support.", renew:"L'offre est mensuelle. Payez à nouveau avant le {d} pour ne pas l'interrompre.",
  support:"Support sur WhatsApp", accTitle:"Compte", changePass:"Changer le mot de passe", curPass:"Mot de passe actuel", newPass:"Nouveau mot de passe", passChanged:"Mot de passe changé",
  uiLang:"Langue du tableau de bord"
},
es: {
  login:"Entrar", signup:"Crear cuenta", email:"Correo", password:"Contraseña", passHint:"Mínimo 8 caracteres", name:"Tu nombre",
  business:"Nombre del negocio", niche:"Tipo de negocio", country:"País", lang:"Idioma", currency:"Moneda", plan:"Plan",
  createAccount:"Crear cuenta y empezar la prueba", enter:"Entrar", haveAccount:"Ya tengo cuenta", noAccount:"Aún no tengo cuenta",
  trialNote:"7 días gratis. Sin tarjeta.", backSite:"Volver a la web",
  niches:{clinica:"Clínica / dentista", salao:"Peluquería / barbería", restaurante:"Restaurante / delivery", imobiliaria:"Inmobiliaria", outro:"Otro"},
  plans:{ess:"Esencial", pro:"Profesional", com:"Completo"}, month:"/mes", perMonth:"{n} respuestas al mes",
  err:{invalid_email:"Revisa el correo.", weak_password:"La contraseña necesita al menos 8 caracteres.", missing_business:"Escribe el nombre del negocio.",
    email_taken:"Ya existe una cuenta con ese correo. Usa Entrar.", wrong_login:"Correo o contraseña incorrectos.", wrong_password:"La contraseña actual es incorrecta.",
    too_many_attempts:"Demasiados intentos. Espera unos minutos.", already_claimed:"Ya avisaste un pago. Espera la confirmación.",
    suspended:"Cuenta suspendida. Habla con soporte.", generic:"Algo salió mal. Inténtalo de nuevo.", offline:"No hay conexión con el servidor."},
  nav:{home:"Inicio", wa:"WhatsApp", bot:"Asistente", test:"Probar", chats:"Conversaciones", plan:"Plan", account:"Cuenta"}, logout:"Salir",
  hello:"Hola, {name}", stTrial:"Prueba gratis hasta el {d}", stActive:"Plan activo hasta el {d}",
  stExpired:"Tu periodo terminó. Paga el plan para que el asistente vuelva a responder.", stSuspended:"Cuenta suspendida. Habla con soporte.",
  cWa:"WhatsApp", waOn:"Conectado · +{n}", waOff:"No conectado", waQr:"Esperando el escaneo del QR", waConnecting:"Conectando…",
  cUsage:"Respuestas este mes", cBot:"Asistente", botOn:"Encendido", botOff:"Apagado", turnOn:"Encender", turnOff:"Apagar",
  steps:"Primeros pasos", s1:"Conecta tu WhatsApp", s2:"Escribe la información del negocio", s3:"Prueba el asistente", s4:"Paga el plan antes de que acabe la prueba",
  waTitle:"Conectar tu WhatsApp", waHow:["Abre WhatsApp en el móvil del negocio.","Android: ⋮ > Dispositivos vinculados. iPhone: Ajustes > Dispositivos vinculados.","Toca Vincular un dispositivo y apunta la cámara al código."],
  genQr:"Generar código QR", qrWait:"Generando el código…", qrStopped:"El código caducó. Genera otro cuando tengas el móvil a mano.",
  waDone:"Tu WhatsApp está conectado. El asistente ya responde a tus clientes.", disconnect:"Desconectar WhatsApp", confirm:"Haz clic otra vez para confirmar",
  waNote:"Tu móvil sigue funcionando normal. Cuando respondes una conversación, el asistente se calla en ella el tiempo que elijas.",
  waRisk:"Esta conexión usa el mismo método que WhatsApp Web. No uses el asistente para envíos masivos, para evitar que bloqueen el número.",
  botTitle:"Configurar el asistente", info:"Información del negocio",
  infoHint:"Escribe todo lo que el asistente necesita saber. Solo responde con lo que esté aquí.",
  infoPh:"Horario: lunes a viernes, 9:00–18:00; sábado 9:00–13:00\nDirección: ...\nServicios y precios:\n- Servicio A: ...\n- Servicio B: ...\nFormas de pago: ...\nEnvío / citas: cómo funciona\nPreguntas frecuentes:\n- ...",
  tone:"Forma de hablar", tones:{amigavel:"Amable", formal:"Formal", descontraido:"Informal"}, mainLang:"Idioma principal",
  instr:"Instrucciones extra (opcional)", instrPh:"Ej.: ofrece siempre el hueco libre más cercano. No hables de descuentos.",
  notify:"Enviar a mi WhatsApp un resumen de cada pedido, cita o petición de hablar conmigo",
  media:"Cuando un cliente mande audio o foto, pedirle que escriba", pause:"Cuando respondo una conversación, el asistente se calla en ella durante", minutes:"minutos",
  save:"Guardar", saved:"Guardado", testTitle:"Probar el asistente", testHint:"Conversa como si fueras un cliente. La prueba no usa tu WhatsApp ni las respuestas del plan.",
  testPh:"Escribe como un cliente…", send:"Enviar", reset:"Empezar de nuevo", notifyPreview:"Aviso que te llegaría al WhatsApp:",
  aiBusy:"El asistente está ocupado. Inténtalo en unos segundos.", aiOff:"La IA aún no está configurada en el servidor.",
  chatsTitle:"Conversaciones", chatsEmpty:"Las conversaciones aparecen aquí cuando tus clientes escriban.", pausedTag:"asistente en pausa",
  pause1h:"Pausar el asistente en esta conversación (1h)", resume:"Reactivar el asistente en esta conversación", you:"Tú", botName:"Asistente", back:"Volver",
  planTitle:"Tu plan", current:"Actual", choose:"Elegir", payTitle:"Pago",
  payText:"Paga {amount} con PayPal (tarjeta o saldo). Después haz clic en “Ya pagué”. El plan se activa en cuanto lo confirmemos.",
  cveNote:"PayPal no acepta escudos, así que el importe se cobra en euros.", payBtn:"Pagar con PayPal", paidBtn:"Ya pagué",
  paidNote:"Nombre o correo usado en PayPal (opcional)", claimed:"Recibimos tu aviso. Confirmaremos el pago pronto.",
  noPaypal:"El pago online aún no está disponible. Habla con soporte.", renew:"El plan es mensual. Paga de nuevo antes del {d} para que no se detenga.",
  support:"Soporte por WhatsApp", accTitle:"Cuenta", changePass:"Cambiar contraseña", curPass:"Contraseña actual", newPass:"Nueva contraseña", passChanged:"Contraseña cambiada",
  uiLang:"Idioma del panel"
}
};

window.fmtMoney = function (n, cur, lang) {
  if (cur === "CVE") return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "$00 CVE";
  const loc = cur === "BRL" ? "pt-BR" : ({ pt: "pt-PT", en: "en-US", fr: "fr-FR", es: "es-ES" })[lang] || "pt-PT";
  return new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
};
window.fmtDate = function (iso, lang) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(({ pt: "pt-PT", en: "en-GB", fr: "fr-FR", es: "es-ES" })[lang] || "pt-PT", { day: "numeric", month: "long", timeZone: "UTC" });
};
window.api = async function (url, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(url, { method, headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" }, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin" });
  } catch { const e = new Error("offline"); e.code = "offline"; throw e; }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.includes("/login") && !url.includes("/password")) { location.href = "/entrar"; }
  if (!res.ok) { const e = new Error(data.error || "generic"); e.code = data.error || "generic"; throw e; }
  return data;
};
window.getLang = function () {
  try { const l = localStorage.getItem("lang"); if (window.I18N[l]) return l; } catch {}
  const n = (navigator.language || "pt").slice(0, 2);
  return window.I18N[n] ? n : "pt";
};
window.setLang = function (l) { try { localStorage.setItem("lang", l); } catch {} };
