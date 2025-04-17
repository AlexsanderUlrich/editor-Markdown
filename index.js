let pipWindow = null;
let isSyncingFromPip = false; // Flag de proteção contra loop

// Criação do SimpleMDE no editor principal
const simplemde = new SimpleMDE({
  autofocus: true,
  autosave: {
    enabled: true,
    uniqueId: "MyUniqueID",
    delay: 1000,
  },
  element: document.getElementById("bloquinho"),
  spellChecker: false,
  forceSync: true,
  hideIcons: ["guide", "heading"],
  initialValue: "Katchau!",
  lineWrapping: false,
  placeholder: "Escreva seu Markdown aqui...",
  renderingConfig: {
    codeSyntaxHighlighting: true,
  },
  status: ["autosave", "lines", "words", "cursor"],
  tabSize: 4,
});

// Escuta mudanças no editor principal e envia para o PiP (evitando eco)
simplemde.codemirror.on("change", () => {
  if (isSyncingFromPip) return; // Bloqueia se a origem foi o PiP

  const content = simplemde.value();
  if (pipWindow) {
    pipWindow.postMessage({
      type: 'from-main',
      content: content
    }, '*');
  }
});

// Recebe alterações do PiP e atualiza o conteúdo do editor principal com preservação do cursor
window.addEventListener('message', (event) => {
  if (event.data?.type === 'from-pip') {
    const newContent = event.data.content;
    const currentContent = simplemde.value();

    if (newContent !== currentContent) {
      isSyncingFromPip = true;

      const cm = simplemde.codemirror;
      const cursor = cm.getCursor(); // Salva o cursor

      simplemde.value(newContent);   // Atualiza conteúdo
      cm.setCursor(cursor);          // Restaura posição do cursor

      setTimeout(() => {
        isSyncingFromPip = false; // Libera a sincronização
      }, 100);
    }
  }
});

// Função para abrir o editor em modo Picture-in-Picture
async function enterPiP() {
  if (!documentPictureInPicture) {
    alert("Seu navegador não suporta Document Picture-in-Picture.");
    return;
  }

  pipWindow = await documentPictureInPicture.requestWindow();
  const pipDoc = pipWindow.document;
  const editorContent = simplemde.value();

  pipDoc.open();
  pipDoc.write(`
    <!DOCTYPE html>
    <html lang="pt_BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Editor PiP</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/simplemde@1.11.2/dist/simplemde.min.css">
      <link rel="stylesheet" href="index.css" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        #conteiner {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        	justify-content: center;
        }
        .CodeMirror {
          height: 90% !important;
          width: 90% !important;
        }
        .editor-toolbar {          
          width: 90% !important;
        }
      </style>
    </head>
    <body>
      <main id="main">
        <div id="conteiner">
          <textarea id="bloquinho" placeholder="Digite o texto Markdown aqui...">${editorContent}</textarea>
        </div>
      </main>

      <script src="https://cdn.jsdelivr.net/npm/simplemde@1.11.2/dist/simplemde.min.js"></script>
    </body>
    </html>
  `);
  pipDoc.close();

  pipWindow.addEventListener("load", () => {
    const script = pipWindow.document.createElement("script");
    script.innerHTML = `
      let pipSimpleMDE = new SimpleMDE({
        element: document.getElementById("bloquinho"),
        forceSync: true,
        hideIcons: ["guide", "heading"],
        placeholder: "Editor no PiP"
      });

      let typingTimeout = null;

      pipSimpleMDE.codemirror.on("change", () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          const content = pipSimpleMDE.value();
          window.opener.postMessage({
            type: 'from-pip',
            content: content
          }, '*');
        }, 300);
      });

      window.addEventListener('message', (event) => {
        if (event.data?.type === 'from-main') {
          if (pipSimpleMDE.value() !== event.data.content) {
            pipSimpleMDE.value(event.data.content);
          }
        }
      });

      window.addEventListener('beforeunload', () => {
        window.opener.postMessage({
          type: 'from-pip',
          content: pipSimpleMDE.value()
        }, '*');
      });
    `;
    pipWindow.document.body.appendChild(script);
  });

  pipWindow.postMessage({
    type: 'from-main',
    content: editorContent
  }, '*');
}


// Função para baixar conteúdo em .md
function baixar() {
  const texto = document.getElementById("bloquinho").value;
  const titulo = document.getElementById("titulo").value || "sem-titulo";
  const blob = new Blob([texto], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, titulo + ".md");
}
