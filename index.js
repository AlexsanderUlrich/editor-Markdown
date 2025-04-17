let pipWindow = null;
let typingTimeout = null;

// Criação do SimpleMDE no editor principal
var simplemde = new SimpleMDE({
  autofocus: true,
  autosave: {
    enabled: true,
    uniqueId: "MyUniqueID",
    delay: 1000,
  },
  element: document.getElementById("bloquinho"),
  forceSync: true,
  hideIcons: ["guide", "heading"],
  initialValue: "Katchau!",
  lineWrapping: false,
  placeholder: "Escreva seu Markdown aqui...",
  previewRender: function (plainText) {
    return customMarkdownParser(plainText); // Returns HTML from a custom parser
  },
  renderingConfig: {
    codeSyntaxHighlighting: true,
  },
  status: ["autosave", "lines", "words", "cursor"],
  tabSize: 4,
});

// Função para entrar no PiP
async function enterPiP() {
  if (!documentPictureInPicture) {
    alert("Seu navegador não suporta Document Picture-in-Picture.");
    return;
  }

  // Seleciona o container onde o editor está
  const conteiner = document.querySelector("#conteiner");

  // Cria a janela PiP
  pipWindow = await documentPictureInPicture.requestWindow();
  const pipDoc = pipWindow.document;

  const editorContent = simplemde.value(); // Captura o conteúdo do editor

  // Abre a janela PiP e injeta o conteúdo do editor
  pipDoc.open();
  pipDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
      <style>
        body { margin: 0; padding: 10px; }
        textarea { width: 100%; height: 100%; box-sizing: border-box; }
      </style>
    </head>
    <body>
      <textarea id="pipEditor">${editorContent}</textarea>
      <script src="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js"></script>
      <script>
        let pipSimpleMDE;

        window.onload = () => {
          // Inicializa o SimpleMDE na janela PiP
          pipSimpleMDE = new SimpleMDE({ element: document.getElementById("pipEditor") });

          // Envia as mudanças de volta para a página principal
          pipSimpleMDE.codemirror.on("change", () => {
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
              window.opener.postMessage({
                type: 'from-pip',
                content: pipSimpleMDE.value()
              }, '*');
            }, 300);  // Delay de 300ms
          });

          // Escuta mensagens do principal para atualizar o conteúdo
          window.addEventListener('message', (event) => {
            if (event.data?.type === 'from-main') {
              pipSimpleMDE.value(event.data.content);
            }
          });

          // Envia as alterações de volta para o principal quando a janela PiP for fechada ou descarregada
          window.addEventListener('beforeunload', () => {
            window.opener.postMessage({
              type: 'from-pip',
              content: pipSimpleMDE.value()
            }, '*');
          });
        };
      </script>
    </body>
    </html>
  `);
  pipDoc.close();

  // Enviar o conteúdo do editor principal para o PiP (somente quando o PiP é aberto)
  pipWindow.postMessage({
    type: 'from-main',
    content: simplemde.value()
  }, '*');
}

// Função para baixar o arquivo markdown
function baixar() {
  const texto = document.getElementById("bloquinho").value;
  const titulo = document.getElementById("titulo").value;

  var blob = new Blob([texto], { type: "text/markdown: charset=utf-8" });

  saveAs(blob, titulo + '.md');
};

// Escutando a mensagem da janela PiP para atualizar o editor principal
window.addEventListener('message', (event) => {
  if (event.data?.type === 'from-pip') {
    simplemde.value(event.data.content); // Atualiza o conteúdo no editor principal
  }
});
