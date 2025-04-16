let pipWindow = null;
// Most options demonstrate the non-default behavior
var simplemde = new SimpleMDE({
	autofocus: true,
	autosave: {
		enabled: true,
		uniqueId: "MyUniqueID",
		delay: 1000,
	},
	blockStyles: {
		bold: "__",
		italic: "_"
	},
	element: document.getElementById("bloquinho"),
	forceSync: true,
	hideIcons: ["guide", "heading"],
	indentWithTabs: false,
	initialValue: "Katchau!",
	
	lineWrapping: false,
	parsingConfig: {
		allowAtxHeaderWithoutSpace: true,
		strikethrough: false,
		underscoresBreakWords: true,
	},
	placeholder: "Escreva seu Markdown aqui...",
	previewRender: function(plainText) {
		return customMarkdownParser(plainText); // Returns HTML from a custom parser
	},
	previewRender: function(plainText, preview) { // Async method
		setTimeout(function(){
			preview.innerHTML = customMarkdownParser(plainText);
		}, 250);

		return "Loading...";
	},
	promptURLs: true,
	renderingConfig: {
		singleLineBreaks: false,
		codeSyntaxHighlighting: true,
	},
	shortcuts: {
		drawTable: "Cmd-Alt-T"
	},
	showIcons: ["code", "table"],
	spellChecker: false,
	status: false,
	status: ["autosave", "lines", "words", "cursor"], // Optional usage
	status: ["autosave", "lines", "words", "cursor", {
		className: "keystrokes",
		defaultValue: function(el) {
			this.keystrokes = 0;
			el.innerHTML = "0 Keystrokes";
		},
		onUpdate: function(el) {
			el.innerHTML = ++this.keystrokes + " Keystrokes";
		}
	}], // Another optional usage, with a custom status bar item that counts keystrokes
	styleSelectedText: false,
	tabSize: 4,
});

async function enterPiP() {
	const conteiner = document.querySelector("#conteiner");
	const pipOptions = { width: 800, height: 800 };

	pipWindow = await documentPictureInPicture.requestWindow(pipOptions);
	
	// Move o conteúdo para a janela PiP
	pipWindow.document.body.appendChild(conteiner);	

	// Foco automático no textarea
	requestAnimationFrame(() => {
		const pipBloquinho = pipWindow.document.querySelector("#bloquinho");
		if (pipBloquinho) pipBloquinho.focus();
	});

	// Reposiciona o container ao fechar a janela PiP
	pipWindow.addEventListener("pagehide", () => {
		const main = document.querySelector("#main");
		if (conteiner && main) main.appendChild(conteiner);
	}, { once: true });
	
};

function baixar() {
	const texto = document.getElementById("bloquinho").value;
	const titulo = document.getElementById("titulo").value;

	var blob = new Blob([texto], { type: "text/markdown: charset=utf-8" });

	saveAs(blob, titulo + '.md');
};
