/*

  Custom Learning Journal in Rise
  -------------------------------

  version: 2.1
  Project page: https://github.com/mikeamelang/learning-journal


  The Learning Journal allows a learner to enter text responses to
  journal prompts throughout a Rise module. At the end of the module, the learner
  can print their “learning journal” of all their responses. The responses are saved
  to the computer so that they persist on future visits to the Rise module.

  HOW TO ADD JOURNAL PROMPTS:
  Wherever a Journal Entry is needed in the Rise module, add a new block of type
  “NOTE” from the “STATEMENT” area and enter the following text:

    Journal Entry
    Section: <insert section name here>
    Prompt: <insert prompt here>
    Take Action: yes <if this is a Take Action item>

  HOW TO ADD AN INTRO TO A SECTION ON THE PRINTED JOURNAL:
  Wherever an intro to a section is needed in the Rise module, add a new block of type
  “NOTE” from the “STATEMENT” area and enter the following text:

    Section Intro
    Section: <insert section name here>
    Section Order: <insert printing order number here. This is optional)
    Intro Title: <insert title to the intro here, like Reflection Activity>
    Intro Text: <insert the text of the intro here>

  HOW TO ADD PRINT BUTTONS OR PROVIDE A CUSTOM TITLE TO THE LEARNING JOURNAL:
  Two print buttons will be shown: Print all journal items and Print take
  action items only. (The actual text of these buttons is customized with the variables below:
  PrintAllButton_Text, PrintTakeActionsOnly_Text and EmailButton_Text)
  Wherever the print buttons are desired in the Rise module, add a new block of type
  “NOTE” from the “STATEMENT” area and enter the following text:

    Journal Buttons
    Course Title: <insert course title here>
    Include Email Button: <yes/no> (This is not required. Default is no.)
    Email Address: <insert email to which journals will be emailed> (This is only required
      if the above "Include Email Button" is set to true.)

*/

// These css selectors select the Notes and select the contents of each Note
var noteSelector =  ".block-impact--note .block-impact__row"; // "[aria-label='Note']";
var noteContentsSelector = '.fr-view';

// These are the flags that must appear at the first line of the Note or the
// Note will not be successfully processed
var flagEntry = "Journal Entry";
var flagButtons = "Journal Buttons";
var flagIntro = "Section Intro";
var flagSelect = "Journal Select";
var flagSelectTwo = "Journal Select Two";
var flagRadio = "Journal Entry Radio";

// These are the labels that accompany the data. These must be entered exactly
// correct or the Note will not be successfully processed
var sectionlabel = "Section:";
var promptlabel = "Prompt:";
var takeactionlabel = "Take Action:";
var coursetitlelabel = "Course Title:";
var includeEmailButtonLabel = "Include Email Button:";
var emailAddressLabel = "Email Address:";
var introsectionlabel = "Section:";
var introSectionOrderLabel = "Section Order:";
var introtitlelabel = "Intro Title:";
var introtextlabel = "Intro Text:";
var optionlabel = "Options:";

// These are the text for the Print buttons
var PrintAllButton_Text = "Print My Journal";
var PrintTakeActionsOnly_Text = "Print My Actions";
var EmailButton_Text = "Email My Journal"; // text for the Email button, if active


// These are the data storage variables. When the course loads, these are filled
// with any existing journal entries found in localStorage. Likewise, when any entries are
// updated, these data storage variables are updated AND the localStorage is updated.
var UserData = {};
UserData.Sections = [];
var courseTitle = '';

// localStorageItem is the item in localStorage where the journal entry data is stored.
// a unique identifier is formed by concatenating
// localStorageItem_prefix and the URL path up to the html file.
var localStorageItem_prefix = 'LearningJournal_V17_';
var localStorageItem = '';

// These are the settings used by the autosave of journal entries
var typingTimer;                //  timer identifier
var doneTypingInterval = 300;  //  time in ms

// Test if browser is firefox (used in printEntries)
var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

/* ------------------------------------------------------------------------------------------------ */
// Window for using LMS functions
var windowObj = window.parent;
// console.log(windowObj)
//Chagge variable to true if you're going to publish in LMS
var courseVersionForLMS = false;

let date = new Date();
let dtmTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0,-5); 

function GetTodayDate() {
  var tdate = new Date();
  var dd = tdate.getDate(); //yields day
  var MM = tdate.getMonth(); //yields month
  var yyyy = tdate.getFullYear(); //yields year
  var currentDate= dd + "-" +( MM+1) + "-" + yyyy;

  return currentDate;
}

$(document).ready(function() {
  setlocalStorageItem();
  getSectionsfromLocalStorage();
  initialProcessNotes();
  addEvents();

  $('#app').on('DOMNodeInserted', function(e) {

    if($('#app #book_pdf').length<1){
      //Add book Button
      $('#app .transition-group').append('<button href="#book_modal" class="view-book" id="book_pdf">Book</button>');
      //Add book Iframe
      $('body').append('<div class="modal-overaly"><div class="modal-book" id="book_modal"><span class="close" rel:close>&#10005;</span><iframe id="book_iframe" src="assets/custom/PDFBookView/index.html?page=1" frameborder="0" width="100%" height="600"></iframe></div></div>');
    } 

    $('#app .blocks-lesson select').trigger('change');

    $("#app textarea").on('keyup change', function() {
      var promptText = $(this).prev().text();
      if(promptText == "What skills and strategies have you used to successfully navigate complex accounts?"){
        if (this.value.length > 1300)
        this.value = this.value.substr(0, 1300);
      } else if(promptText == "People who can help"||promptText == "People who can help [part2]"||promptText == "People who can help [part3]"){
        if (this.value.length > 230)
        this.value = this.value.substr(0, 230);
      }else if(promptText == "Actions I can take"||promptText == "Actions I can take [part2]"||promptText == "Actions I can take [part3]"){
        if (this.value.length > 500)
        this.value = this.value.substr(0, 500);
      }else {
        if (this.value.length > 700)
          this.value = this.value.substr(0, 700);
      }
      
    });     

    if($(this).find('[data-block-id="cl9zr7u9x0007356pk20s0qez"]').length){    
      if($('#app #print_journal').length<1){
        $('#app [data-block-id="cl9zr7u9x0007356pk20s0qez"] .block-impact__quote').append('<button id="print_journal">PRINT JOURNAL</button>');
        $('body').append('<iframe id="print_iframe" src="assets/custom/PDFBookView/pdfwebpage.html" frameborder="0" width="100%" height="0"></iframe>');
      }   
    }   
    
    var pageTitle = $(this).find('.nav-sidebar__outline-section-item__link.active').text();
    if(pageTitle == "Rank your proficiency" || pageTitle == "Re-rank your proficiency") {
      pageNum = 2;
    }else if(pageTitle == "Networking" || pageTitle == "Preparation" || pageTitle == "Building trust") {
      pageNum = 3;
    }else if(pageTitle == "Navigating the account" || pageTitle == "Inspiring action" || pageTitle == "Building consensus") {
      pageNum = 4;
    }else if(pageTitle == "Agility" || pageTitle == "Accountability") {
      pageNum = 5;
    }else if(pageTitle == "Competencies to further develop") {
      pageNum = 6;
    } else {
      pageNum = 1;
    }
    $('body #book_iframe').attr('src', "assets/custom/PDFBookView/index.html?page=" + pageNum);  
  });
  
});
 

window.addEventListener("hashchange", function(){
  console.log('hashchange --- checkLMSData');

  // var currentHash = $('body').find('.nav-sidebar__outline-section-item__link.active').attr('href');
  
  // checkLMSData(currentHash);  

  checkContinueButton();
});


/**
  * @desc check is there any new answers in LocalStorage and send new responses
  * @param none
  * @return none
*/
function checkLMSData(hash){
  console.log('function checkLMSData');
  // Add data to LMS from Local Storage
  var UserData = {}; 
  UserData.Sections = [];  

  var lessonNameLink = $('body').find('.navButtonsFull__navPrev .lesson-nav-link__link').attr('href');
  var lessonName = $('body').find('.nav-sidebar__outline-section-item__link[href="'+lessonNameLink+'"]').text();
  console.log(lessonName)

  // Getting values from LocalStorage
  for ( var i=0; i<localStorage.length; ++i ) {
      var retrieved = localStorage.getItem( 'LearningJournal_V17_' );		
      UserData.Sections = JSON.parse(retrieved);	      	
  }

  if(hash == '#/lessons/o8F0rVRNyWALoq0DA0xdG2njRrec2cwi') {
    console.log('full submit')

    for (var index = 0; index < UserData.Sections.length; index++){
      var currentSection = UserData.Sections[index];
      var startCountId;
      
      if(currentSection.title == 'Self-Assessment' ){
        startCountId = 0; 
        var elResponse = '';     

        for (let entry = 0; entry < currentSection.entries.length; entry++) {
          var el = currentSection.entries[entry];
          var elResponseItem = el.response,
              elPromptItem = el.prompt;    
          
          elResponse += elPromptItem+":"+elResponseItem+"; "
        }
        setLMSData(startCountId, elResponse, currentSection.title); 
      } else if( currentSection.title == 'Re-rank your proficiency' ){
        startCountId = 1;        
        var elResponse = '';     

        for (let entry = 0; entry < currentSection.entries.length; entry++) {
          var el = currentSection.entries[entry];
          var elResponseItem = el.response,
              elPromptItem = el.prompt;     
          
          elResponse += elPromptItem+":"+elResponseItem+"; "
        }
        setLMSData(startCountId, elResponse, currentSection.title);
      } else if(currentSection.title == 'Networking' ){
        startCountId = 2; 
        startFor(startCountId);       
      } else if(currentSection.title == 'Preparation' ){
        startCountId = 4; 
        startFor(startCountId);       
      } else if(currentSection.title == 'Building trust' ){
        startCountId = 6;   
        startFor(startCountId);     
      } else if(currentSection.title == "Navigating the account" ){
        startCountId = 8;    
        startFor(startCountId);    
      } else if(currentSection.title == "Inspiring action" ){
        startCountId = 9;
        startFor(startCountId);        
      } else if(currentSection.title == "Building consensus" ){
        startCountId = 11; 
        startFor(startCountId);       
      } else if(currentSection.title == "Agility" ){
        startCountId = 13;  
        startFor(startCountId);      
      } else if(currentSection.title == "Accountability" ){
        startCountId = 15;   
        startFor(startCountId);   
      } else if(currentSection.title == "Competencies to further develop" ){
        startCountId = 18; 
        startFor(startCountId);  
      }

      function startFor(startCountId){ 
        for (let entry = 0; entry < currentSection.entries.length; entry++) {
          const element = currentSection.entries[entry];
          var elResponse = element.response,
              elPrompt = element.prompt,
              newId = startCountId+entry;
      
          setLMSData(newId, elResponse, elPrompt);        
        }
      }

    } 

  } else {
    for (var index = 0; index < UserData.Sections.length; index++){
      var currentSection = UserData.Sections[index];
      var startCountId;
      
      if(lessonName == 'Rank your proficiency' && currentSection.title == 'Self-Assessment' ){
        startCountId = 0; 
        var elResponse = '';     

        for (let entry = 0; entry < currentSection.entries.length; entry++) {
          var el = currentSection.entries[entry];
          var elResponseItem = el.response,
              elPromptItem = el.prompt;    
          
          elResponse += elPromptItem+":"+elResponseItem+"; "
        }
        setLMSData(startCountId, elResponse, currentSection.title); 
      } else if(lessonName == 'Re-rank your proficiency' && currentSection.title == 'Re-rank your proficiency' ){
        startCountId = 1;        
        var elResponse = '';     

        for (let entry = 0; entry < currentSection.entries.length; entry++) {
          var el = currentSection.entries[entry];
          var elResponseItem = el.response,
              elPromptItem = el.prompt;     
          
          elResponse += elPromptItem+":"+elResponseItem+"; "
        }
        setLMSData(startCountId, elResponse, currentSection.title);
      } else if(lessonName == 'Networking' && currentSection.title == 'Networking' ){
        startCountId = 2; 
        startFor(startCountId);       
      } else if(lessonName == 'Preparation' && currentSection.title == 'Preparation' ){
        startCountId = 4; 
        startFor(startCountId);       
      } else if(lessonName == 'Building trust' && currentSection.title == 'Building trust' ){
        startCountId = 6;   
        startFor(startCountId);     
      } else if(lessonName == 'Navigating the account' && currentSection.title == "Navigating the account" ){
        startCountId = 8;    
        startFor(startCountId);    
      } else if(lessonName == 'Inspiring action' && currentSection.title == "Inspiring action" ){
        startCountId = 9;
        startFor(startCountId);        
      } else if(lessonName == 'Building consensus' && currentSection.title == "Building consensus" ){
        startCountId = 11; 
        startFor(startCountId);       
      } else if(lessonName == 'Agility' && currentSection.title == "Agility" ){
        startCountId = 13;  
        startFor(startCountId);      
      } else if(lessonName == 'Accountability' && currentSection.title == "Accountability" ){
        startCountId = 15;   
        startFor(startCountId);   
      } else if(lessonName == 'Competencies to further develop' && currentSection.title == "Competencies to further develop" ){
        startCountId = 18; 
        startFor(startCountId);  
      }

      function startFor(startCountId){ 
        for (let entry = 0; entry < currentSection.entries.length; entry++) {
          const element = currentSection.entries[entry];
          var elResponse = element.response,
              elPrompt = element.prompt,
              newId = startCountId+entry;
      
          setLMSData(newId, elResponse, elPrompt);        
        }
      }

    } 
  }
}

/**
  * @desc Send data to LMS
  * @param string objid - id of iteraction
  * @param string response - user response
  * @param string prompt - question
  * @return none
*/
function setLMSData(objid, response, prompt){  
  console.log('setLMSData');

  if(courseVersionForLMS){    
    var id = prompt.replace(/ /g,'_').replace(/\W/g, '').substring(0, 254);
    var strDescription = String(prompt);
    var blnCorrect = "neutral";
    var correctresponse = null;
    var weighting = null;
    // var latency = (new Date().getTime() - window.interactionStart);
    var latency = '0000:00:00.00'; //0000:00:02.28
    var strResponse = String(response); 

    windowObj.SCORM2004_objAPI.SetValue('cmi.interactions', objid);
    windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.id', id);
    windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.type', 'fill-in');
    windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.timestamp', dtmTime);
    windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.learner_response', strResponse);
    windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.result', blnCorrect);
    // windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.latency', latency);
    windowObj.SCORM2004_CallSetValue('cmi.interactions.'+objid+'.description', strDescription);   
  } 
} 



// Open book PDF
$(document).on('click', '#book_pdf', function(e){
  e.preventDefault();
  $('.modal-overaly').addClass('open');

  var iFrameTest = document.getElementById('book_iframe'); 
      iFrameTest.contentWindow.CreateBookView();

  $('.close').on('click', function(){
    $(this).closest('.modal-overaly').removeClass('open');
  })

});
// Open book PDF
$(document).on('click', '#print_journal', function(e){
  e.preventDefault();

  var iFramePrint = document.getElementById('print_iframe'); 
      iFramePrint.contentWindow.CreateBookView(true);
});


$(document).on('change', '.journalentry-select-two select', function(){   

  var seletArr = [];

  $('.journalentry-select-two select').each(function(){    
    var selectVal = $(this).val();

    if(selectVal!=null){
      seletArr.push(selectVal);      
    }     
    
  })
  // console.log(seletArr);

  $('.journalentry-select-two select option').each(function(){

    $(this).prop('disabled', false);
    var thisVal = $(this).text()
  
    for (let i = 0; i < seletArr.length; i++) {
      const e = seletArr[i];  

      if( !$(this).is(':selected') && thisVal == e ){
        $(this).prop('disabled', true);
      }      
      
    }
    
  })

})




/**
  * @desc sets the value for the variable localStorageItem by concatenating
  *     localStorageItem_prefix and and the URL path up to the html file
  * @param none
  * @return string
*/
function setlocalStorageItem() {
  var loc = document.location;
  var uniqueURL = loc.origin + loc.pathname.substring(0, loc.pathname.lastIndexOf("/"));
  // localStorageItem = localStorageItem_prefix + encodeURIComponent(uniqueURL);
  localStorageItem = localStorageItem_prefix;
}



/**
  * @desc Run processNotes several times when the page first loads
  * @return none
*/
function initialProcessNotes(  ) {
  console.log('initialProcessNotes')
  var MAX_INSTANCES = 5;
  var instances = 0;
  var myInterval = setInterval(myTimerProcessNotes, 300);
  function myTimerProcessNotes() {
    instances++;
    if (instances === MAX_INSTANCES ) {
      clearInterval(myInterval);
    }
    if (processNotes()) { clearInterval(myInterval) }
  }
}



/**
  * @desc add eventlisteners so that the func processNotes is fired when appropriate
  * @param none
  * @return none
*/
function addEvents() {

  // fire processNotes when the url changes
  function hashchanged(){
    processNotes();
  }
  window.addEventListener("hashchange", hashchanged, false);

  // fire processNotes when the CONTINUE button is clicked and new blocks are dynamically added
  function nodeadded(event) {
    if( event.relatedNode.nodeName == "SECTION" ) {
      if ( event.relatedNode.className == "blocks-lesson" ) {
        processNotes();
      }
    }

  }
  window.addEventListener("DOMNodeInserted", nodeadded, false);
 
}



/**
  * @desc Create Section object
  * @param string title - title of section
  * @param string introtitle - title of the section intro that appears in printed journal
  * @param string introtext - text of the section intro that appears in printed journal
  * @return none
*/
function Section( title, order, introtitle, introtext ) {
  if (!order) {
    order = 999
  }
    this["title"] = title;
    this["order"] = order;
    this["entries"] = [];
    introtitle = (introtitle) ? introtitle : '';
    this["introtitle"] = introtitle; // optional
    introtext = (introtext) ? introtext : '';
    this["introtext"] = introtext; // optional
}


/**
  * @desc Create Entry object
  * @param string section - which section does this entry belong in (linked to a Section object)
  * @param string prompt - text of the prompt
  * @param string response - text of the response (blank if new)
  * @param bool isTakeAction - is this a Take Action?
  * @return none
*/
function Entry( section, prompt, response, isTakeAction, option ) {
	this["section"] = section;
	this["prompt"] = prompt;
  this["response"] = response;
  this["isTakeAction"] = isTakeAction;
  this["option"] = option;
    // another data element is entryid, added after the entry is created
    // another data element is sectionid, added after the entry is created
}


/**
  * @desc these functions either copy localStorageItem to UserData.Sections or vice versa
  * @param none
  * @return none
*/
function setSectionstoLocalStorage() {
  localStorage.setItem(localStorageItem, JSON.stringify(UserData.Sections));

  // checkLMSData();
}
function getSectionsfromLocalStorage() {
  var retrievedString = localStorage.getItem(localStorageItem);
  if ( retrievedString == null || retrievedString == '' ) {
    localStorage.setItem(localStorageItem, '');
    var emptyarray = [];
    return emptyarray;
  } else {
    UserData.Sections = JSON.parse(retrievedString);
  }
}


/**
  * @desc This is the workhorse of the learning journal. It finds all the Notes on the page
  *   and processes them depending on what type of Note it is
  * @param none
  * @return true if Notes were found
*/
function processNotes() {

    var $notes = $(noteSelector);
    var returnValue = ($notes.length > 0) ? true : false ;

    $notes.each( function() {
      switch (this.querySelector(noteContentsSelector).firstChild.innerText.trim()) {
        case flagEntry:
          processEntry( this );
          this.parentNode.removeChild(this);
          break;

        case flagSelect:
          processSelect( this );
          this.parentNode.removeChild(this);
          break;
        
        case flagSelectTwo:
          processSelectTwo( this );
          this.parentNode.removeChild(this);
          break;

        case flagRadio:
          processRadio( this );
          this.parentNode.removeChild(this);
          break;

        case flagButtons:
          processButtons( this);
          this.parentNode.removeChild(this);
          break;

        case flagIntro:
          processIntro( this );
          this.parentNode.removeChild(this);
          break;

        default:
          break;
      }

    });
    setSectionstoLocalStorage();
    return returnValue;
}


/**
  * @desc This processes an Entry. If successful, it updates UserData
  *   and renders the entry to DOM
  * @param jQueryObject note - the note to be processed
  * @return none
*/
function processEntry( note ) {

  var entry = createEntryfromNote( note );
  if ( entry ) {

    // use indexSection and indexEntry to determine if this is a new section and entry
    var indexSection = -1; indexEntry = -1;
    for (var i = 0; i < UserData.Sections.length; i++) {
      var currentSection = UserData.Sections[i];
      if ( currentSection.title == entry.section ) { indexSection = i; }
      for (var j = 0; j < currentSection.entries.length; j++ ) {
        if ( currentSection.entries[j].section == entry.section &&
          currentSection.entries[j].prompt == entry.prompt ) {
          indexEntry = j;
        }
      }
    }

    // New section, new entry
    if (indexSection == -1 && indexEntry == -1 ) {
      indexSection = UserData.Sections.length;
      indexEntry = 0;
      var newsection = new Section( entry.section );
      newsection.entries.push( entry );
      UserData.Sections.push( newsection );
    }

    // Existing section, new entry
    if (indexSection > -1 && indexEntry == -1 ) {
      indexEntry = UserData.Sections[indexSection].entries.length;
      UserData.Sections[indexSection].entries.push( entry );
    }

    // Existing section, existing entry
    if (indexSection > -1 && indexEntry > -1 ) {
      entry.response = UserData.Sections[indexSection].entries[indexEntry].response;
    }

    renderEntrytoDOM( note.parentNode, entry, indexSection, indexEntry );
  }
}

/**
  * @desc This processes an Select. If successful, it updates UserData
  *   and renders the entry to DOM
  * @param jQueryObject note - the note to be processed
  * @return none
*/
function processSelect( note ) {

    var entry = createEntryfromNote( note );
    
    if ( entry ) {
  
      // use indexSection and indexEntry to determine if this is a new section and entry
      var indexSection = -1; indexEntry = -1;
      for (var i = 0; i < UserData.Sections.length; i++) {
        var currentSection = UserData.Sections[i];
        if ( currentSection.title == entry.section ) { indexSection = i; }
        for (var j = 0; j < currentSection.entries.length; j++ ) {
          if ( currentSection.entries[j].section == entry.section &&
            currentSection.entries[j].prompt == entry.prompt ) {
            indexEntry = j;
          }
        }
      }
  
      // New section, new entry
      if (indexSection == -1 && indexEntry == -1 ) {
        indexSection = UserData.Sections.length;
        indexEntry = 0;
        var newsection = new Section( entry.section );
        newsection.entries.push( entry );
        UserData.Sections.push( newsection );
      }
  
      // Existing section, new entry
      if (indexSection > -1 && indexEntry == -1 ) {
        indexEntry = UserData.Sections[indexSection].entries.length;
        UserData.Sections[indexSection].entries.push( entry );
      }
  
      // Existing section, existing entry
      if (indexSection > -1 && indexEntry > -1 ) {
        entry.response = UserData.Sections[indexSection].entries[indexEntry].response;
      }
  
      renderSelecttoDOM( note.parentNode, entry, indexSection, indexEntry );
    }
  
}
function processSelectTwo( note ) {

  var entry = createEntryfromNote( note );
  if ( entry ) {

    // use indexSection and indexEntry to determine if this is a new section and entry
    var indexSection = -1; indexEntry = -1;
    for (var i = 0; i < UserData.Sections.length; i++) {
      var currentSection = UserData.Sections[i];
      if ( currentSection.title == entry.section ) { indexSection = i; }
      for (var j = 0; j < currentSection.entries.length; j++ ) {
        if ( currentSection.entries[j].section == entry.section &&
          currentSection.entries[j].prompt == entry.prompt ) {
          indexEntry = j;
        }
      }
    }

    // New section, new entry
    if (indexSection == -1 && indexEntry == -1 ) {
      indexSection = UserData.Sections.length;
      indexEntry = 0;
      var newsection = new Section( entry.section );
      newsection.entries.push( entry );
      UserData.Sections.push( newsection );
    }

    // Existing section, new entry
    if (indexSection > -1 && indexEntry == -1 ) {
      indexEntry = UserData.Sections[indexSection].entries.length;
      UserData.Sections[indexSection].entries.push( entry );
    }

    // Existing section, existing entry
    if (indexSection > -1 && indexEntry > -1 ) {
      entry.response = UserData.Sections[indexSection].entries[indexEntry].response;
    }

    renderSelectTwotoDOM( note.parentNode, entry, indexSection, indexEntry );
  }

}
function processRadio( note ) {

  var entry = createEntryfromNote( note );
  
  if ( entry ) {

    // use indexSection and indexEntry to determine if this is a new section and entry
    var indexSection = -1; indexEntry = -1;
    for (var i = 0; i < UserData.Sections.length; i++) {
      var currentSection = UserData.Sections[i];
      if ( currentSection.title == entry.section ) { indexSection = i; }
      for (var j = 0; j < currentSection.entries.length; j++ ) {
        if ( currentSection.entries[j].section == entry.section &&
          currentSection.entries[j].prompt == entry.prompt ) {
          indexEntry = j;
        }
      }
    }

    // New section, new entry
    if (indexSection == -1 && indexEntry == -1 ) {
      indexSection = UserData.Sections.length;
      indexEntry = 0;
      var newsection = new Section( entry.section );
      newsection.entries.push( entry );
      UserData.Sections.push( newsection );
    }

    // Existing section, new entry
    if (indexSection > -1 && indexEntry == -1 ) {
      indexEntry = UserData.Sections[indexSection].entries.length;
      UserData.Sections[indexSection].entries.push( entry );
    }

    // Existing section, existing entry
    if (indexSection > -1 && indexEntry > -1 ) {
      entry.response = UserData.Sections[indexSection].entries[indexEntry].response;
    }

    renderRadiotoDOM( note.parentNode, entry, indexSection, indexEntry );
  }

}


/**
  * @desc renders an Entry to DOM.
  * @param DOMElement parentcontainer - entry's parent container
  * @param Entry entry - the entry
  * @param string sectionid - the id of the corresponding section in UserData.Sections
  * @param string entryid - the id on the entry within UserData.Sections
  * @return none
*/
function renderEntrytoDOM( parentcontainer, entry, sectionid, entryid ) {

    // create container
    var container = document.createElement("div");
    container.className = "journalentry-container journalentry-textarea-wrap";
    container.dataset.sectionid = sectionid;
    container.dataset.entryid = entryid;

    // create prompt
    var prompt = document.createElement("div");
    prompt.className = "journalentry-prompt";
    prompt.innerText = entry.prompt;
    container.appendChild( prompt );

    // create response
    var response = document.createElement("textarea");
    response.className = "journalentry-response";
    response.value = entry.response;
    container.appendChild(response);
    parentcontainer.appendChild(container);

    $( ".block-impact--note:has( .journalentry-container)").addClass("block-impact--note-journalentry");

    checkContinueButton();
}

/**
  * @desc renders an Select to DOM.
  * @param DOMElement parentcontainer - entry's parent container
  * @param Entry entry - the entry
  * @param string sectionid - the id of the corresponding section in UserData.Sections
  * @param string entryid - the id on the entry within UserData.Sections
  * @return none
*/
function renderSelecttoDOM( parentcontainer, entry, sectionid, entryid ) {

    // create container
    var container = document.createElement("div");
    container.className = "journalentry-container journalentry-select-wrap journalentry-select-one";
    container.dataset.sectionid = sectionid;
    container.dataset.entryid = entryid;

    // create prompt
    var prompt = document.createElement("div");
    prompt.className = "journalentry-prompt";
    prompt.innerText = entry.prompt;
    container.appendChild( prompt );    

    // create response
    var response = document.createElement("select");

    var optionsList = entry.option,
        optionsListArr =optionsList.split(',');

    for (var i = 0; i<optionsListArr.length; i++){
        var opt = document.createElement('option');
        if(optionsListArr[i] == "--Select--"){
          opt.value ='';
          opt.innerHTML = optionsListArr[i];

          addFirstSelected();
        } else {
          opt.value =optionsListArr[i];
          opt.innerHTML = optionsListArr[i];
        }
        
        response.appendChild(opt);
    }

    function addFirstSelected (){
      response.selectedIndex = 0;
    }

    response.className = "journalentry-response journalentry-select";
    response.value = entry.response;

    //create select wrap
    var wrap = document.createElement("div");
    wrap.className = "select-wrapper";

    wrap.appendChild(response);
    container.appendChild(wrap);

    parentcontainer.appendChild(container);

    $( ".block-impact--note:has( .journalentry-container)").addClass("block-impact--note-journalentry");

    checkContinueButton();
}
function renderSelectTwotoDOM( parentcontainer, entry, sectionid, entryid ) {

  // create container
  var container = document.createElement("div");
  container.className = "journalentry-container journalentry-select-wrap journalentry-select-two";
  container.dataset.sectionid = sectionid;
  container.dataset.entryid = entryid;

  // create prompt
  var prompt = document.createElement("div");
  prompt.className = "journalentry-prompt";
  prompt.innerText = entry.prompt;
  container.appendChild( prompt );
  

  // var disabledSelect = document.createElement("select");
  var disabledSelect = document.createElement("div");

  if(localStorage.length){
    for (var i = 0; i < UserData.Sections.length; i++) {
      var currentSection = UserData.Sections[i];

      // console.log(currentSection);

      if ( currentSection.title == 'Self-Assessment' ){

        for (var j = 0; j < currentSection.entries.length; j++ ) {
          console.log(currentSection.entries[j]);
          if(currentSection.entries[j].prompt == entry.prompt){
            var valS = currentSection.entries[j].response;
            // var opt = document.createElement('option');
            var opt = document.createElement('span');
            // opt.value = valS;
            opt.innerHTML = valS;

            disabledSelect.appendChild(opt);

            // disabledSelect.value = valS;
          }
        }        
      }
    }
  }

  // for (var i = 1; i<=9; i++){
  //     var opt = document.createElement('option');
  //     opt.value = i;
  //     opt.innerHTML = i;
  //     disabledSelect.appendChild(opt);
  // }
  disabledSelect.disabled = true;
  disabledSelect.className = "journalentry-select journalentry-select-disabled";
  
  container.appendChild(disabledSelect);

  // create response
  var response = document.createElement("select");

  var optionsList = entry.option,
      optionsListArr =optionsList.split(',');

    for (var i = 0; i<optionsListArr.length; i++){
        var opt = document.createElement('option');
        opt.value =optionsListArr[i];
        opt.innerHTML = optionsListArr[i];
        response.appendChild(opt);
    }

  // for (var i = 1; i<=9; i++){
  //     var opt = document.createElement('option');
  //     opt.value = i;
  //     opt.innerHTML = i;
  //     response.appendChild(opt);
  // }
  response.className = "journalentry-response journalentry-select";
  response.value = entry.response;
  container.appendChild(response);
  parentcontainer.appendChild(container);

  $( ".block-impact--note:has( .journalentry-container)").addClass("block-impact--note-journalentry");
}
function renderRadiotoDOM( parentcontainer, entry, sectionid, entryid ) {

  var container = document.createElement("div");
  container.className = "journalentry-container journalentry-radio-wrap";
  container.dataset.sectionid = sectionid;
  container.dataset.entryid = entryid;

  // create prompt
  var prompt = document.createElement("div");
  prompt.className = "journalentry-prompt";
  prompt.innerText = entry.prompt;
  container.appendChild( prompt );    

  // create response
  var response = document.createElement("div");

  var optionsList = entry.option,
      optionsListArr = optionsList.split(',');

  for (var i = 0; i<optionsListArr.length; i++){

    var label = document.createElement("label");
    var span = document.createElement("span");
    var radio = document.createElement("input");
    radio.type = "checkbox";
    radio.name = 'checkbox_name';
    radio.value = optionsListArr[i];

    label.appendChild(radio);
    label.appendChild(span);
    label.appendChild(document.createTextNode(optionsListArr[i]));

    response.appendChild(label);
  }

  response.className = "journalentry-response journalentry-radio-list";
  response.value = entry.response;

  //create select wrap
  var wrap = document.createElement("div");
  wrap.className = "radio-wrapper";

  wrap.appendChild(response);
  container.appendChild(wrap);

  parentcontainer.appendChild(container);

  var checkedListArr = [];
  if(localStorage.length){
    for (var i = 0; i < UserData.Sections.length; i++) {
      var currentSection = UserData.Sections[i];

      // console.log(currentSection);

      if ( currentSection.title == "Daniel's therapy journey-Part I" ){

        for (var j = 0; j < currentSection.entries.length; j++ ) {
          
          var currentEntry = currentSection.entries[j];
          if(currentEntry.prompt == "Strategy 1 - Competency applied:" || currentEntry.prompt =="Strategy 2 - Competency applied:" || currentEntry.prompt =="Strategy 3 - Competency applied:"){
            if(currentEntry.response!=null && currentEntry.response!=""){
              checkedListArr.push(currentEntry.response);
            }
          }           
        }  

      } else if( currentSection.title == "Daniel's therapy journey-Part II" ){
        for (var j = 0; j < currentSection.entries.length; j++ ) {
          
          var currentEntry = currentSection.entries[j];
          if(currentEntry.prompt == "Strategy 4 - Competency applied:" || currentEntry.prompt =="Strategy 5 - Competency applied:"){
            if(currentEntry.response!=null && currentEntry.response!=""){
              checkedListArr.push(currentEntry.response);
            }
          }           
        } 
      } else if ( currentSection.title == "Daniel's therapy journey-Part III" ){
        for (var j = 0; j < currentSection.entries.length; j++ ) {
          
          var currentEntry = currentSection.entries[j];
          if(currentEntry.prompt == "Strategy 6 - Competency applied:" || currentEntry.prompt =="Strategy 7 - Competency applied:"){
            if(currentEntry.response!=null && currentEntry.response!=""){
              checkedListArr.push(currentEntry.response);
            }
          }           
        } 
      }
    }    

    $('#app [name="checkbox_name"]').each(function(){
      var $this = $(this),
          currentVal = $this.val();

      for (let v = 0; v < checkedListArr.length; v++) {
        const element = checkedListArr[v];

        if (currentVal == element){
          $this.prop('checked', true);
        }
      }
      
    })

    // console.log(checkedListArr)
  }

  $( ".block-impact--note:has( .journalentry-container)").addClass("block-impact--note-journalentry");
}


/**
  * @desc creates an Entry object from a Note.
  * @param DOMElement note - note from which to create the entry
  * @return Entry object or null if fail (section or prompt is empty)
*/
function createEntryfromNote( note ) {

    var section = '',
        prompt = '',
        option = '',
        isTakeAction = false;

  var notecontents = note.querySelector(noteContentsSelector);

  for (var i = 0; i< notecontents.childNodes.length; i++ ) {
    var a = notecontents.childNodes[i];

    // set the section
    if ( a.innerText.substring(0,sectionlabel.length) == sectionlabel ) {
      section = a.innerText.substring(sectionlabel.length).trim();
    }
    // set the prompt
    if ( a.innerText.substring(0,promptlabel.length) == promptlabel ) {
      prompt = a.innerText.replace(promptlabel, "").trim();
    }
    // set the options for Select
    if ( a.innerText.substring(0,optionlabel.length) == optionlabel ) {
      option = a.innerText.replace(optionlabel, "").trim();
    }
    // set the takeaction
    if ( a.innerText.substring(0,takeactionlabel.length) == takeactionlabel ) {
      var TakeActiontext = a.innerText.replace(takeactionlabel, "").trim();
      if ( TakeActiontext.toLowerCase() == "yes" ) { isTakeAction = true }
    }
  }

  if (section != '' && prompt != '' && option != '') {
    return new Entry( section, prompt, '', isTakeAction, option); // response is added later
  } else if (section != '' && prompt != '') {
    return new Entry( section, prompt, '', isTakeAction, option); // response is added later
  } else {
    return null;
  }
}


/**
  * @desc This processes the Buttons. It updates sets the courseTitle variable
  *   and renders the buttons to DOM
  * @param DOMElement note - note
  * @return none
*/
function processButtons( note ) {

  var includeEmailButton = false;
  var emailAddress = '';

  // Set Course Title
  var notecontents = note.querySelector(noteContentsSelector);
  for (var i = 0; i< notecontents.childNodes.length; i++ ) {
    var a = notecontents.childNodes[i];

    // Set the Course Title
    if ( a.innerText.substring(0,coursetitlelabel.length) == coursetitlelabel ) {
      courseTitle = a.innerText.substring(coursetitlelabel.length).trim();
    }

    // Include an Email button
    if ( a.innerText.substring(0,includeEmailButtonLabel.length) == includeEmailButtonLabel ) {
      var emailButtonSetting = a.innerText.replace(includeEmailButtonLabel, "").trim();
      if ( emailButtonSetting.toLowerCase() == "yes" ) { includeEmailButton = true }
    }

    // Email address to which the journals will be emailed
    if ( a.innerText.substring(0,emailAddressLabel.length) == emailAddressLabel ) {
      emailAddress = a.innerText.substring(emailAddressLabel.length).trim();
    }
  }

  // Render buttons to DOM
  var container = document.createElement("div");
  container.className = "journalbuttons-container";

  var button1 = document.createElement("div");
  button1.className = "journalprintbutton";
  button1.innerText = PrintAllButton_Text;
  button1.addEventListener("click", function() { printEntries(false)} );
  container.appendChild(button1);

  var button2 = document.createElement("div");
  button2.className = "journalprintbutton";
  button2.innerText = PrintTakeActionsOnly_Text;
  button2.addEventListener("click", function() { printEntries(true)} );
  container.appendChild(button2);
  note.parentNode.appendChild(container);

  if ( includeEmailButton ) {
    var button3 = document.createElement("div");
    button3.className = "journalprintbutton";
    button3.innerText = EmailButton_Text;
    button3.addEventListener("click", function() { emailEntries( emailAddress )} );
    container.appendChild(button3);
    note.parentNode.appendChild(container);
  }
}


/**
  * @desc This processes a Section Intro, saving the intro information to UserData
  * @param DOMElement note - note
  * @return none
*/
function processIntro( note ) {

  var notecontents = note.querySelector(noteContentsSelector);
  var introsection = '', introSectionOrder = 999, introtitle = '', introtext = '';
  for (var i = 0; i< notecontents.childNodes.length; i++ ) {
    var a = notecontents.childNodes[i];

    // set the intro section
    if ( a.innerText.substring(0,introsectionlabel.length) == introsectionlabel ) {
      introsection = a.innerText.substring(introsectionlabel.length).trim();
    }
    // set the intro section index
    if ( a.innerText.substring(0,introSectionOrderLabel.length) == introSectionOrderLabel ) {
      introSectionOrder = parseInt(a.innerText.substring(introSectionOrderLabel.length).trim());
      if ( introSectionOrder !== introSectionOrder ) { //  is not a number
        introSectionOrder = 999
      }
    }
    // set the intro title
    if ( a.innerText.substring(0,introtitlelabel.length) == introtitlelabel ) {
      introtitle = a.innerText.substring(introtitlelabel.length).trim();
    }
    // set the intro text
    if ( a.innerText.substring(0,introtextlabel.length) == introtextlabel ) {
      introtext = a.innerText.replace(introtextlabel, "").trim();

      // grab the rest of the Note for the text also
      i++;
      while (i < notecontents.childNodes.length) {
        introtext += "<br /><br />" + notecontents.childNodes[i].innerText;
        i++;
      }
    }
  }

  if (introsection != '' && introtitle != '' && introtext != '') {
    var sectionMatch = -1;
    for (var j = 0; j < UserData.Sections.length; j++) {
      if ( UserData.Sections[j].title == introsection ) { sectionMatch = j; }
    }

    if (sectionMatch == -1) {
      // new section
      UserData.Sections.push( new Section( introsection, introSectionOrder, introtitle, introtext ) );
    } else {
      // existing section
      UserData.Sections[sectionMatch].order = introSectionOrder;
      UserData.Sections[sectionMatch].introtitle = introtitle;
      UserData.Sections[sectionMatch].introtext = introtext;
    }
    UserData.Sections.sort( compareOrders )
  }

  // SUB function
  // Sorts an array of objects on a particular property
  function compareOrders( a, b ) {
    if ( a.order < b.order ){
      return -1;
    }
    if ( a.order > b.order ){
      return 1;
    }
    return 0;
  }
}


// Set up autosave of journal entries to UserData and to localStorage
// see https://stackoverflow.com/questions/4220126/run-javascript-function-when-user-finishes-typing-instead-of-on-key-up?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
// keyup
$(document).on('keyup change', '.journalentry-response', function(){

    clearTimeout(typingTimer);
    var myentrycontainer = $(this).closest('.journalentry-container');

    typingTimer = setTimeout(function() {      
      var response = myentrycontainer.find('.journalentry-response').val();      
      var sectionid = myentrycontainer.data('sectionid');
      var entryid = myentrycontainer.data('entryid');

      UserData.Sections[sectionid].entries[entryid].response = response;

      setSectionstoLocalStorage();  
      
      checkContinueButton();
      
    }, doneTypingInterval);
});

//Adding Clear button to Ranking lists
$(document).on('click', '[data-block-id="clb4v8ta7000y356w5ubscbb8"] .blocks-button__button, [data-block-id="clb4v9j0j001n356wu4ndi8n7"] .blocks-button__button', function(e){
  e.preventDefault();

  $('#app .journalentry-select').each(function(){
    var $this = $(this);
    // console.log($this);

    $this.find('option[disabled]').prop('disabled', false);

    $this.prop("selectedIndex", 0);
    
      var myentrycontainer = $(this).closest('.journalentry-container');

      var response = myentrycontainer.find('.journalentry-response').val();
      var sectionid = myentrycontainer.data('sectionid');
      var entryid = myentrycontainer.data('entryid');

      UserData.Sections[sectionid].entries[entryid].response = response;

      // console.log(UserData.Sections);    

      setSectionstoLocalStorage();
  })

  checkContinueButton();
});



$(document).on('change', '.journalentry-select', function(){  
  
  var entryId = $(this).closest('.journalentry-select-wrap').data('entryid'),
      sectionId = $(this).closest('.journalentry-select-wrap').data('sectionid'),
      sectionValue = UserData.Sections[sectionId].entries[entryId].response;

  // setTimeout(function() {  
    var selectList = $('.journalentry-select-wrap[data-sectionid="'+sectionId+'"] select');

    // console.log(selectList)

    var seletArr = [];

    selectList.each(function(){
      var currentVal = $(this).val();

      if(currentVal!=null && currentVal!="--Select--"){
        seletArr.push(currentVal);      
      }      

      $('.journalentry-select-wrap[data-sectionid="'+sectionId+'"] select option').each(function(){ 

        $(this).prop('disabled', false);
        var thisVal = $(this).text()

        for (let i = 0; i < seletArr.length; i++) {
          const e = seletArr[i];  

          if( !$(this).is(':selected') && thisVal == e && thisVal != "--Select--" ){
            $(this).prop('disabled', true);
          }      
          
        }
        
      })

    }) 
  // }, 1000);

  checkContinueButton();
})


function checkContinueButton(){
  $('.page').each(function(){
    var page = $(this);

    var getBlockQty = page.find('.journalentry-response').length,
    valid = true;

    if(getBlockQty>0){
      let conrinueBtn = page.find('.continue-btn');

      page.find('.page__content').addClass('page-locked');

      page.find('.journalentry-response').each(function(){
        var currentVal = $(this).val();

        if(currentVal==="" || currentVal==null) {
          valid = false;
        }
      })

      if(valid){
        page.find('.page__content').removeClass('page-locked');
      } else {
        page.find('.page__content').addClass('page-locked');

      }

      setSectionstoLocalStorage();  
    }
  })
 
}


// Polyfill for isNaN
Number.isNaN = Number.isNaN || function(value) {
    return value !== value;
}