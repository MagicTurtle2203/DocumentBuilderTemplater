const { dialog, Menu } = require('electron').remote

var core = {
	sections : [],
	answers : {},
	answerInserts : {},
	finalInserts : {},
	currentSectionIndex : 0
}

const fs = require('fs')

var answerDiv = document.getElementById("questionAnswer");

var savePath = ""

// on the landing panel, have a button where they can browse for a file
function startProgramHandler() {
	setMenu();
	
	addSectionButton();
}

function setMenu() {
	const template = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New',
					accelerator: 'CmdOrCtrl+N',
					click() {
						clear();
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Open',
					accelerator: 'CmdOrCtrl+O',
					click() {
						dialog.showOpenDialog({
							title: "Select Configuration File",
							buttonLabel: "Use File",
							properties: ["openFile"],
							message: "Select the config file to use.",
							filters: [
								{name: 'Json', extensions: ['json']},
								{name: 'All Files', extensions: ['*']}
							]
						}).then(function(value) {
							fs.readFile(value.filePaths[0], 'utf8', (err, data) => {
								if (err) throw err;

								try {
									core.sections = JSON.parse(data);
									counter.num = core.sections.length;
								} catch (err) {
									if (err) throw err;
								}

								makeProgressPane();

								loadSection(core.currentSectionIndex);
							});
						});
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Save',
					accelerator: 'CmdOrCtrl+S',
					click() {
						if (!savePath) {
							dialog.showSaveDialog({
								title: "Save Document",
								buttonLabel: "Save Document",
								filters: [{name: 'json', extensions: ['json']}]
							}).then(function(value) {
								fs.writeFile(value.filePath, JSON.stringify(core.sections, null, '\t'), (err) => {
									if (err) throw err;
									console.log('Saved');
								})
								savePath = value.filePath;
							});
						} else {
							fs.writeFile(savePath, JSON.stringify(core.sections, null, '\t'), (err) => {
								if (err) throw err;
								console.log('Saved');
							})
						}
					}
				},
				{
					label: 'Save As...',
					accelerator: 'CmdOrCtrl+Shift+S',
					click() {
						dialog.showSaveDialog({
							title: "Save Document",
							buttonLabel: "Save Document",
							filters: [{name: 'json', extensions: ['json']}]
						}).then(function(value) {
							fs.writeFile(value.filePath, JSON.stringify(core.sections, null, '\t'), (err) => {
								if (err) throw err;
								console.log('Saved');
							})
							savePath = value.filePath;
						});
					}
				}
			]
		},
		{
			label: 'View',
			submenu: [
				{
					label: 'Reload',
					accelerator: 'CmdOrCtrl+R',
					click (item, focusedWindow) {
						if (focusedWindow) focusedWindow.reload()
					}
				},
				{
					label: 'Toggle Developer Tools',
					accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
					click (item, focusedWindow) {
						if (focusedWindow) focusedWindow.webContents.toggleDevTools()
					}
				},
				{
					type: 'separator'
				},
				{
					role: 'resetzoom'
				},
				{
					role: 'zoomin'
				},
				{
					role: 'zoomout'
				},
				{
					type: 'separator'
				},
				{
					role: 'togglefullscreen'
				}
			]
		},
		{
			label: 'Window',
			submenu: [
				{
					role: 'minimize'
				},
				{
					role: 'close'
				}
			]
		}
	]

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

function clear() {
	$('#navbar').empty();
	$('#questionText').empty();
	$('#questionAnswer').empty();
	$('#help').empty();
	$('#section-editor').empty();
}

function handleConfigs(sections) {
	if(sections != null) {
		core.sections = sections;
		console.log("Loaded sections from config file.");
	}
	
	if(core.sections != null) {
		console.log("finished loading and storing all configs");
		setup();
	}
}

function setup() {
	// Assemble the progress pane from the loaded sections
	makeProgressPane();
	
	// For now, we run the script for search warrants
	searchWarrantScript();
	
	// Set the height of the main window
	$('#topGrid').height(window.innerHeight);
}

function makeProgressPane() {
	$('#navbar').html("");
	// For each section, make an append a button that loads its section
	for(i in core.sections) {
		var sectionTitle = core.sections[i].sectionTitle;
		
		var progressButton = document.createElement("a");
		progressButton.className = "progressButton";
		progressButton.innerHTML = sectionTitle;
		progressButton.id = i;
		progressButton.name = sectionTitle + "_button";
		progressButton.addEventListener("click", progressButtonHandler)
		
		var progressContent = document.getElementById('navbar');
		progressContent.appendChild(progressButton);
	}

	$(`#${core.currentSectionIndex}`).addClass("pactive");

	addSectionButton();
}

function searchWarrantScript() {
	// Toggle the first button visually
	$('#'+core.currentSectionIndex).toggleClass('pactive');
	
	// Load the current section
	loadSection(core.currentSectionIndex, answerDiv);
	
	setBodyScale();
}

// This function creates and appends a single input line with a label
function addSingleLineInput(questionID, questionLabel) {
	var selector = document.createElement("button");
	selector.className = "selector";
	selector.addEventListener('click', function() {
		loadItemEditor(this);
	});

	var label = document.createElement("div");
	
	label.className = "singleLineInputFieldLabel";
	label.id = questionID + "_label";
	label.innerHTML += questionLabel;
	
	var input = document.createElement("input");
	input.type = "text";
	input.className = "singleLineInputField";
	input.id = questionID;
	
	if(core.answers[questionID] != undefined && core.answers[questionID] != "") {
		input.value = core.answers[questionID];
	}
	
	selector.appendChild(label);
	selector.appendChild(input);

	answerDiv.appendChild(selector); 
}

// This function creates and appends a text box input with default text if given
function addTextBoxInput(questionID, questionLabel, defaultText) {
	var selector = document.createElement("button");
	selector.className = "selector";
	selector.addEventListener('click', function() {
		loadItemEditor(this);
	});

	var label = document.createElement("div");
	
	label.className = "textBoxFieldInputLabel";
	label.id = questionID + "_label";
	label.innerHTML += questionLabel;
	
	var input = document.createElement("textarea");
	input.type = "text";
	input.wrap = "soft";
	input.className = "textBoxFieldInput"; 
	input.id = questionID;
	
	if(core.answers[questionID] != undefined && core.answers[questionID] != "") {
		input.value = core.answers[questionID];
	} else if(defaultText != null) {
		input.value = defaultText;
	}

	selector.appendChild(label);
	selector.appendChild(input);
	
	answerDiv.appendChild(selector);
	resizeTextarea();
}

function resizeTextarea() {
	$('textarea').not(".resize-exclude", function () {
		this.setAttribute('style', 'height:' + (this.scrollHeight + 3) + 'px;overflow-y:auto;');
	});
}

// This function creates and appends a yes/no question that will toggle the section
function addyesNoQuestion(questionID, questionLabel) {
	var selector = document.createElement("button");
	selector.className = "selector";
	selector.addEventListener('click', function() {
		loadItemEditor(this);
	});

	var label = document.createElement("div");
	label.className = "textBoxFieldInputLabel";
	label.innerHTML += questionLabel;
	
	var buttonDiv = document.createElement("div");
	buttonDiv.className = "questionButtonGroup";
	buttonDiv.id = questionID + "_Group";
	
	var yesButton = document.createElement("button");
	yesButton.id = questionID + "_YesButton";
	yesButton.name = questionID;
	yesButton.className = "questionButton btn";
	yesButton.innerHTML = "Yes";
	yesButton.onclick = yesNoButtonHandler;
	
	var noButton = document.createElement("button");
	noButton.id = questionID + "_NoButton";
	noButton.name = questionID;
	noButton.className = "questionButton btn";
	noButton.innerHTML = "No";
	noButton.onclick = yesNoButtonHandler;
	
	if(core.answers[questionID]) {
		yesButton.className += " active";
	} else {
		noButton.className += " active";
	}
	
	buttonDiv.appendChild(noButton); 
	buttonDiv.appendChild(yesButton);
	
	selector.appendChild(label);
	selector.appendChild(buttonDiv);

	answerDiv.appendChild(selector);
}

// This function creates a multiple choice question that only allows for one selected answer
function addSingleChoiceOption(questionID, questionLabel, options) {
	var selector = document.createElement("button");
	selector.className = "selector";
	selector.addEventListener('click', function() {
		loadItemEditor(this);
	});

	var label = document.createElement("div");
	
	label.className = "singleLineInputFieldLabel";
	label.id = questionID + "_label";
	label.innerHTML += questionLabel;
	
	var form = document.createElement("form");
	form.id = questionID;
	form.className = "radioInputField";
	for(i in options) {
		var wrapper = document.createElement("div");
		wrapper.className = "radioOptionWrapper";
		
		var radioOption = document.createElement("input");
		radioOption.type = "radio";
		radioOption.value = options[i];
		radioOption.name = questionID;
		radioOption.className = "radioOption";
		wrapper.appendChild(radioOption);
		
		wrapper.appendChild(document.createTextNode(options[i]));
		
		form.appendChild(wrapper);
	}
	
	selector.appendChild(label);
	selector.appendChild(form);

	answerDiv.appendChild(selector);
}

function yesNoButtonHandler() {
	var yesOrNo = $(window.event.target)[0].outerText;
	var questionID = $(window.event.target)[0].name;

	if( (yesOrNo.toLowerCase() === "yes" && !core.answers[questionID]) || (yesOrNo.toLowerCase() === "no" && core.answers[questionID]) ){
		$(this).parent().children('button').each(function() {$(this).toggleClass('active')});
	}

	var sectionInputs = core.sections[core.currentSectionIndex].sectionInputs;

	if(yesOrNo.toLowerCase() == "yes") { // The button pressed was a "Yes" button
		if(!core.answers[questionID]) { // Continue only if "Yes" button wasn't already pressed
			core.answers[questionID] = true; // Set the current question to true
			$('#addQuestion').remove();
			$('#submitButton').remove(); // Remove the submit button for now

			// For each question/input in this section that is not a yes/no question, create and append it
			var yesNoIndex = sectionInputs.findIndex(element => element.questionID == questionID);

			for(var n = yesNoIndex+1; n < sectionInputs.length; n++) {
				var sectionInput = sectionInputs[n];

				if(sectionInput.questionID != questionID) {
					if(sectionInput.inputType == "yesNoQuestion") {
						addyesNoQuestion(sectionInput.questionID, sectionInput.inputLabel);
					} else if(sectionInput.inputType == "singleLineText") {
						addSingleLineInput(sectionInput.questionID, sectionInput.inputLabel);
					} else if(sectionInput.inputType == "textBoxInput") {
						addTextBoxInput(sectionInput.questionID, sectionInput.inputLabel, sectionInput.defaultText);
					} else if(sectionInput.inputType == "singleChoiceOption") {
						addSingleChoiceOption(sectionInput.questionID, sectionInput.inputLabel, sectionInput.radioOptions);
					}
				}
			}

			// Re-add the submit button
			addQuestionButton();
			addSubmitButton();
		}

	} else {
		core.answers[questionID] = false;
		var sectionInput = document.getElementById("questionAnswer");

		for (var i = sectionInputs.length - 1; i > sectionInputs.findIndex(element => element.questionID == questionID); i--) {
			sectionInput.removeChild(sectionInput.children[i]);
		}
	}
}

function progressButtonHandler() {
	var progressID = $(window.event.target)[0].id;
	$('.pactive').toggleClass('pactive');
	$(window.event.target).toggleClass('pactive');
	
	core.currentSectionIndex = progressID;
	loadSection(progressID);
	
	if(core.currentSectionIndex == core.sections.length-1) {
		$('#submitButton').html("Submit and Make Document");
	}
}

function addSubmitButton() {
	var button = document.createElement("button");
	button.id = "submitButton";
	button.className = "submitButton btn";
	button.innerHTML = "Save and Continue";
	button.addEventListener("click", submitButtonHandler);
	answerDiv.appendChild(button);
}

function submitButtonHandler() {
	// we need to keep track of the current section and then advance to the next one when the submit button is pressed
	core.currentSectionIndex++;
	if(core.currentSectionIndex >= core.sections.length) {
		// here we should display a confirmation dialog and if they confirm, write the data to the sheet and end the program
		$('#submitButton').html("Submit and Make Document");
	} else if(core.currentSectionIndex == core.sections.length-1) {
		// We are on the LAST section
		loadSection(core.currentSectionIndex, answerDiv);
		$('.active').toggleClass('active');
		$('#'+core.currentSectionIndex).toggleClass('active');
		
		$('#submitButton').html("Submit and Make Document");
		
		// change the button text
	} else {
		loadSection(core.currentSectionIndex, answerDiv);
		$('.active').toggleClass('active');
		$('#'+core.currentSectionIndex).toggleClass('active');
	}
}

function loadSection(sectionIndex) {
	var targetSection = core.sections[sectionIndex];
	// clear the screen
	$('#questionText').empty();
	$('#questionAnswer').empty();
	$('#help').empty();
	$('#section-editor').empty();

	loadSectionEditor(targetSection);
	
	var goodToGo = true;
	if(targetSection.sectionConditions.length > 0) {
		// then there is a condition we must be aware of
		for(i in targetSection.sectionConditions) {
			if(!core.answers[targetSection.sectionConditions[i]]) {
				goodToGo = false;
			}
		}
	}
	
	if(goodToGo) {
		// set the question text
		$('#questionText').html(targetSection.sectionText);
		
		// loop through the inputs and make each thing
		for(index in targetSection.sectionInputs) {
			if(targetSection.sectionInputs[index].inputType == "singleLineText") {
				addSingleLineInput(targetSection.sectionInputs[index].questionID, targetSection.sectionInputs[index].inputLabel);
				
			} else if(targetSection.sectionInputs[index].inputType == "textBoxInput") {
				addTextBoxInput(targetSection.sectionInputs[index].questionID, targetSection.sectionInputs[index].inputLabel, targetSection.sectionInputs[index].defaultText);
				
			} else if(targetSection.sectionInputs[index].inputType == "yesNoQuestion") {
				addyesNoQuestion(targetSection.sectionInputs[index].questionID, targetSection.sectionInputs[index].inputLabel);
				if(core.answers[targetSection.sectionInputs[index].questionID] == undefined || !core.answers[targetSection.sectionInputs[index].questionID]) {
					break;
				}
				
			} else if(targetSection.sectionInputs[index].inputType == "singleChoiceOption") {
				addSingleChoiceOption(targetSection.sectionInputs[index].questionID, targetSection.sectionInputs[index].inputLabel, targetSection.sectionInputs[index].radioOptions)
			}
		}
		
		addQuestionButton();
		addSubmitButton();
		loadHelpPane();
	} else {
		// cannot load this section due to a previous choice. tell them that.
		var reason = targetSection.sectionConditionsFalse;
		$('#questionText').html(reason);
		addQuestionButton();
		addSubmitButton();
	}
}

class Counter {
	constructor() {
		this.i = core.currentSectionIndex;
	}

	get num() {
		this.i++;
		return this.i;
	}

	set num(n) {
		this.i = n;
	}
}

var counter = new Counter();
function addSectionButton() {
	var navbar = document.getElementById("navbar");

	var button = document.createElement("button");
	button.innerHTML = "Add Section";
	button.onclick = function() {
		var section = {sectionTitle: `Section ${counter.num}`, sectionText: "", sectionInputs: [], sectionHelp: [], sectionConditions: []};

		core.sections.push(section);
		core.currentSectionIndex = core.sections.length - 1;
	
		makeProgressPane();
	}

	navbar.appendChild(button);

	loadSection(core.currentSectionIndex);
}

var questionTypes = ['Yes–No Question', 'Single Line', 'Text Box', 'Multiple Choice'];
function addQuestionButton() {
	var main = document.getElementById("questionAnswer");
	var sectionInputs = core.sections[core.currentSectionIndex].sectionInputs;

	var div = document.createElement("div");
	div.id = "addQuestion";
	
	var select = document.createElement("select");
	for (var i in questionTypes) {
		if (questionTypes[i] == "Yes–No Question") {
			if (core.sections[core.currentSectionIndex].sectionInputs.some((elem) => elem.inputType == "yesNoQuestion")) {
				continue;
			}
		}
		var option = document.createElement("option");
		option.text = questionTypes[i];
		select.appendChild(option);
	}

	var button = document.createElement("button");	
	button.innerHTML = "Add Question";
	button.link = select;
	button.onclick = function() {
		var editor = document.getElementById("item-editor");

		if (this.link.value == "Yes–No Question") {
			var question = {
				inputType: "yesNoQuestion",
				questionID: "",
				inputLabel: ""
			}

			sectionInputs.push(question);
			loadSection(core.currentSectionIndex);

			for (var i in question) {
				switch (i) {
					case "questionID":
						var div = document.createElement("div");
						div.innerHTML = "Question ID: "

						var input = document.createElement("input");
						input.type = "text";
						input.link = question;
						input.label = i;

						input.oninput = function() {
							this.link[this.label] = this.value;
						}

						editor.appendChild(input);
						break;
					case "inputLabel":
						var div = document.createElement("div");
						div.innerHTML = "Input Text: "

						var input = document.createElement("input");
						input.type = "text";
						input.link = question;
						input.label = i;

						input.oninput = function() {
							this.link[this.label] = this.value;
						}

						editor.appendChild(input);
						break;
				}
			}
		} else if (this.link.value == "Single Line") {
			var question = {
				inputType: "singleLineText",
				questionID: "",
				inputLabel: ""
			}

			sectionInputs.push(question);
			loadSection(core.currentSectionIndex);
		} else if (this.link.value == "Text Box") {
			var question = {
				inputType: "textBoxInput",
				questionID: "",
				inputLabel: ""
			}

			sectionInputs.push(question);
			loadSection(core.currentSectionIndex);
		}
	}

	div.appendChild(select);
	div.appendChild(button);

	main.appendChild(div);
}

function loadSectionEditor(section) {
	var sectionEditor = document.getElementById("section-editor");

	var sectionTitleDiv = document.createElement("div");
	sectionTitleDiv.innerHTML = "Section Title: ";

	var sectionTitle = document.createElement("input");
	sectionTitle.setAttribute("type", "text");
	sectionTitle.value = section.sectionTitle;
	sectionTitle.oninput = function() {
		core.sections[core.currentSectionIndex].sectionTitle = sectionTitle.value;
		$(`#${core.currentSectionIndex}`).html(sectionTitle.value);
	};

	var sectionTextDiv = document.createElement("div");
	sectionTextDiv.innerHTML = "Section Info: ";

	var sectionText = document.createElement("textarea");
	sectionText.value = section.sectionText;
	sectionText.className = "resize-exclude";
	sectionText.oninput = function() {
		core.sections[core.currentSectionIndex].sectionText = sectionText.value;
		$('#questionText').html(sectionText.value);
	};

	sectionEditor.appendChild(sectionTitleDiv);
	sectionEditor.appendChild(sectionTitle);
	sectionEditor.appendChild(sectionTextDiv);
	sectionEditor.appendChild(sectionText);
}

function loadItemEditor(obj) {
	// var editor = document.getElementById("item-editor");
	// while (editor.firstChild) {
	// 	editor.removeChild(editor.firstChild);
	// }

	// for (var i = 0; i < obj.children.length; i++) {
	// 	if (obj.children[i].className === "helpTitle") {
	// 		var title = document.createElement("div");
	// 		title.innerHTML = "Help Title: ";

	// 		var input = document.createElement("input");
	// 		input.type = "text";
	// 		input.link = obj.children[i];
	// 		input.value = obj.children[i].innerHTML;
	// 		input.oninput = function() {
	// 			this.link.innerHTML = this.value;
	// 		}

	// 		editor.appendChild(title);
	// 		editor.appendChild(input);
	// 	} 
	// 	else if (obj.children[i].className === "helpText") {
	// 		var title = document.createElement("div");
	// 		title.innerHTML = "Help Text: ";

	// 		var input = document.createElement("textarea");
	// 		input.link = obj.children[i];
	// 		input.value = obj.children[i].innerHTML;
	// 		input.oninput = function() {
	// 			this.link.innerHTML = this.value;
	// 		}

	// 		editor.appendChild(title);
	// 		editor.appendChild(input);
	// 	}
	// }
}

function loadHelpPane() {
	var targetSection = core.sections[core.currentSectionIndex];
	var sectionHelp = targetSection.sectionHelp;
	console.log(targetSection)
	
	
	for(var i in sectionHelp) {
		if(sectionHelp[i].helpType == "helpText") {
			var selector = document.createElement("button");
			selector.className = "selector";
			selector.addEventListener('click', function() {
				loadItemEditor(this);
			})

			// Create and append a title section
			var title = document.createElement('div');
			title.className = "helpTitle";
			title.innerHTML = sectionHelp[i].helpTitle;
			
			// Create and append a text section
			var text = document.createElement('div');
			text.className = "helpText";
			text.innerHTML = sectionHelp[i].helpContent;
			
			if (title.innerHTML != "") {
				selector.appendChild(title);
			}
			selector.appendChild(text);

			$("#help").append(selector);			
			
		} else if(sectionHelp[i].helpType == "helpInsert") {
			var selector = document.createElement("button");
			selector.className = "selector";
			selector.addEventListener('click', function() {
				loadItemEditor(this);
			});

			// Create and append a button along with the text it inserts
			var insertWrapper = document.createElement("div");
			insertWrapper.className = "insertWrapper";
			
			var insertButton = document.createElement("button");
			insertButton.id = "insertButton";
			insertButton.className = "btn";
			insertButton.innerHTML = "Insert";
			insertButton.customContent = sectionHelp[i].helpContent;
			insertButton.targetQuestion = sectionHelp[i].targetQuestionID;
			insertButton.addEventListener("click", insertButtonHandler);
			insertWrapper.appendChild(insertButton);
			
			var insertText = document.createElement('div');
			insertText.className = "insertText";
			insertText.innerHTML = sectionHelp[i].helpContent;
			insertWrapper.appendChild(insertText);

			selector.appendChild(insertWrapper);
			
			$('#help').append(selector);
		}
	}
}

function insertButtonHandler() {
	var insertText = $(window.event.target)[0].customContent;
	var questionID = $(window.event.target)[0].targetQuestion;
	console.log(insertText)
	console.log(questionID)
	
	$('#' + questionID).val($('#' + questionID).val() + '\n' + insertText);
	resizeTextarea();
}

$(document).delegate('.textBoxFieldInput', 'keydown', function(e) {
	var keyCode = e.keyCode || e.which;
	
	if (keyCode == 9) {
		e.preventDefault();
		var start = this.selectionStart;
		var end = this.selectionEnd;
		
		// set textarea value to: text before caret + tab + text after caret
		$(this).val($(this).val().substring(0, start)
		+ "\t"
		+ $(this).val().substring(end));
		
		// put caret at right position again
		this.selectionStart =
		this.selectionEnd = start + 1;
	}
});

var $body = $('body'); //Cache this for performance
var $zoomElements = $('#help, #questionText, #questionAnswer, #progressContent')

var setBodyScale = function() {
	var scaleSource = $body.width(),
	scaleFactor = 0.1,                     
	maxScale = 200,
	minScale = 120; //Tweak these values to taste
	
	var fontSize = scaleSource * scaleFactor; //Multiply the width of the body by the scaling factor:
	
	if (fontSize > maxScale) fontSize = maxScale;
	if (fontSize < minScale) fontSize = minScale; //Enforce the minimum and maximums
	
	//$('#helpPane').css('font-size', fontSize + '%');
	$zoomElements.css('font-size', fontSize + '%');
}

$(window).on('resize', function() {
	$('#topGrid').height(window.innerHeight);
	setBodyScale();
})

const shell = require('electron').shell;

// assuming $ is jQuery
$(document).on('click', 'a[href^="http"]', function(event) {
	event.preventDefault();
	shell.openExternal(this.href);
});

// open save dialog
$('#REPL-button').click(function() {
	dialog.showSaveDialog({
		title: "Save Document",
		buttonLabel: "Save Document",
		filters: [{name: 'json', extensions: ['json']}]
	}).then(function(value) {
		fs.writeFile(value.filePath, JSON.stringify(core.sections, null, '\t'), (err) => {
			if (err) throw err;
			console.log('Saved');
		})
	});
});

// tab switcher
$('#editor-button').click(function() {
	$('#REPL').hide();
	$('#editor').show();

	if ($('#code-button').hasClass('active')) {
		$('#code-button').toggleClass('active');
		$('#editor-button').toggleClass('active');
	}
});

$('#code-button').click(function() {
	$('#editor').hide();
	$('#REPL').show();

	if ($('#editor-button').hasClass('active')) {
		$('#code-button').toggleClass('active');
		$('#editor-button').toggleClass('active');
	}
});