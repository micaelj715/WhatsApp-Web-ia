# Micael Automações: atendente com IA no WhatsApp

Plataforma onde o dono de um negócio cria a conta, conecta o próprio WhatsApp por QR code, escreve as informações do negócio e passa a ter um atendente com IA (Groq) respondendo os clientes dele 24 horas por dia. Você administra tudo em `/admin`.

## O que já funciona

| Parte | Endereço | O que faz |
| --- | --- | --- |
| Site de vendas | `/` | 4 idiomas (PT, EN, FR, ES), 4 moedas (CVE, EUR, BRL, USD), demo do atendente, calculadora, planos |
| Cadastro e login | `/entrar` | Conta com 7 dias grátis, sem cartão |
| Painel do cliente | `/app` | Conectar WhatsApp (QR code), configurar o atendente, testar, ver conversas, pagar o plano, trocar senha |
| Seu painel | `/admin` | Clientes, situação de cada um, WhatsApps conectados, receita, confirmar pagamentos, dar mais dias de teste, suspender |

O atendente:
- responde no idioma do cliente, usando só as informações que o dono escreveu;
- junta mensagens seguidas antes de responder e mostra "digitando…";
- quando o cliente quer marcar, pedir, comprar ou falar com uma pessoa, coleta os dados e manda um resumo para o WhatsApp do dono (na conversa "Mensagem para mim");
- fica calado numa conversa quando o dono responde pessoalmente (60 minutos, ajustável);
- pede para escrever quando recebe áudio ou foto;
- respeita o limite de respostas do plano (teste: 300, Essencial: 1.500, Profissional: 5.000, Completo: 15.000 por mês).

## Colocar no ar no Railway (passo a passo)

### 1. Subir o código para o GitHub
1. Crie um repositório novo no GitHub (pode ser privado), por exemplo `micael-automacoes`.
2. Envie **todos os arquivos desta pasta** para ele. Pelo site do GitHub: "Add file" > "Upload files", arraste as pastas `src` e `public` e os arquivos `package.json`, `railway.json`, `.gitignore`, `.env.example`, `README.md`, e clique em "Commit changes".

### 2. Criar o serviço no Railway
1. No Railway: "New Project" > "Deploy from GitHub repo" > escolha o repositório.
2. **Volume (obrigatório):** no serviço, clique com o botão direito (ou em "+ New") > "Volume" e monte em `/data`. É onde ficam o banco de dados e as sessões do WhatsApp. Sem volume, tudo se perde a cada atualização e os clientes teriam de escanear o QR de novo.
3. **Uma réplica só:** em Settings, deixe "Replicas" em 1. As conexões do WhatsApp vivem na memória do servidor.

### 3. Variáveis (aba "Variables")

| Variável | Exemplo | Para quê |
| --- | --- | --- |
| `GROQ_API_KEY` | `gsk_...` | Chave da IA. Crie em console.groq.com > API Keys |
| `ADMIN_EMAIL` | `voce@email.com` | Seu login no `/admin` |
| `ADMIN_PASSWORD` | uma senha forte | Sua senha do `/admin` (mínimo 8 caracteres) |
| `PAYPAL_LINK` | `https://paypal.me/seunome` | Link de pagamento. Se for paypal.me, o valor e a moeda já vão preenchidos |
| `SUPPORT_WHATSAPP` | `2389912345` | Seu WhatsApp de suporte (código do país + número, só números) |
| `DATA_DIR` | `/data` | Pasta do volume (se não definir, usa o caminho do volume do Railway) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Opcional. Modelo da IA |
| `TRIAL_DAYS` | `7` | Opcional. Dias de teste grátis |

### 4. Endereço e domínio
1. Em Settings > Networking, clique em "Generate Domain". O site fica em algo como `micael.up.railway.app`.
2. Para usar seu domínio: "Custom Domain", digite o domínio e crie no seu registrador o registro CNAME que o Railway mostrar.

### 5. Testar
1. Abra `/entrar`, crie uma conta de teste com outro e-mail e conecte um WhatsApp seu.
2. De outro celular, mande uma mensagem para esse número e veja o atendente responder.
3. Entre em `/entrar` com o `ADMIN_EMAIL` para ver o `/admin`.

## Como funciona o pagamento
1. O cliente escolhe o plano no painel e clica em "Pagar com PayPal" (cartão de crédito ou saldo).
2. Depois clica em "Já paguei".
3. O pagamento aparece em `/admin` como "Aguardando". **Confira no seu PayPal se o dinheiro entrou** e clique em "Confirmar". Isso libera 1 mês do plano.
4. Quem escolheu escudo (CVE) paga o equivalente em euros, porque o PayPal não aceita CVE.

Para mudar preços ou limites, edite `src/plans.js`. O site e os painéis se atualizam sozinhos.

## Limites que você precisa conhecer
- **WhatsApp por QR code (Baileys):** é o mesmo método do WhatsApp Web, mas não é oficial para robôs. O WhatsApp pode bloquear números que mandam muitas mensagens para quem não escreveu primeiro. O atendente só responde quem escreveu, o que reduz o risco, mas não o elimina. Quando tiver clientes pagando, o próximo passo é trocar para a API oficial da Meta (o arquivo `src/wa.js` concentra toda a parte do WhatsApp, então a troca fica isolada nele).
- **Groq grátis:** o plano grátis tem limite de pedidos por minuto e por dia. Dá para começar com alguns clientes. Quando crescer, ative o plano pago do Groq (é barato por mensagem) e aumente `AI_CONCURRENCY` se precisar.
- **Mensagens guardadas:** as conversas ficam salvas por 60 dias para o painel e para a IA lembrar do contexto.

## Estrutura

```
src/server.js   rotas, contas, sessões, lógica do atendente
src/wa.js       conexão com o WhatsApp (QR code)
src/ai.js       conversa com a IA (Groq) e instruções do atendente
src/db.js       banco de dados SQLite (embutido no Node 22)
src/plans.js    preços e limites
public/         site, cadastro, painel do cliente e admin
```

Não precisa de banco externo: o SQLite vem embutido no Node 22 e fica no volume.
A única dependência é o `@whiskeysockets/baileys`.
