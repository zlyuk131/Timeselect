/**
* Timeselect Script 0.3.1
* Script allows user to pick time from input field in popover interface.
* Script allows user to select time range and step in minutes.
* Display error message when time selected is outside of time range
* Author: Vyacheslav Zlobin 
* Date: Sept 2016
* @requires timeselect.css (styles for correct rendering)
*/
/*!!!TODO
* 1. Error messages unambigous
* 2. Error messages handling
* 99. Add number keys data input enter confirmation // later
*/
window.onload = function(){    
    //Get all input fields with timeselect class
    var timeSelects = document.getElementsByClassName('timeselect');
    /*START check if timeselect class exists*/
    if (typeof timeSelects !== 'undefined') {
        // var inputDefStyle = [
        //     timeSelects[0].style.backgroundColor ? timeSelects[0].style.backgroundColor : 'none',
        //     timeSelects[0].style.backgroundColor ? timeSelects[0].style.borderColor : 'none'
        // 
        // disable zoom on the page to keep popup layout
        document.firstElementChild.style.zoom = "reset";
        //assign label tags to it's associated input field in to .label prop
        setInputLabelProp();
        //create new time select object
        var timeselect = new Timeselect();
        /**
        * Set time select initial values
        */
        for (var i = 0; i < timeSelects.length; i++) {
            //assign default input value if no data constrints set value is "hh:mm"
            inputSetInitialValue(timeSelects[i]);
            // only to perform actions within context of popover
            timeSelects[i].addEventListener('keydown', function(event){
                timeselect.runKeydown(event);
            }, false);
            // only run on first input focus
            timeSelects[i].addEventListener('focus', function(event) {
                // runs on first input focus
                if (! event.target.classList.contains('timeselect-active')){
                    timeselect.runInputFocus(event);
                }
            }, false);

        }
        // Clear selection on click outside except for designated arrow controls
        window.onclick = function(event) {
            //run timeselect
            //allow click events only on non input field and only when modal is initialised
            if (! event.target.classList.contains('timeselect') && timeselect.initialised){
                timeselect.runWindowClick(event);
            }
        }

        /*------------------------------------------------------------*
        *Initialise time select object
        *Reattach all listeners to timeselect elements after it is created and apended to the DOM 
        --------------------------------------------------------------*/
        function Timeselect() {
            /*START Timeselect obj*/ 
            // !!!Stop 'this' being assigned the 'window' (see 'binding loss') object allow for asyncronous behaviour!!!
            var self = this;
            // singleton function
            if ( !(this instanceof Timeselect)) {
                return new Timeselect(event)
            }

            // event.target element
            self.htmlElem = null; 
            // control if popover is currently disolayed and Timeselect variables has values
            self.initialised = false;
            // Capture active input field
            self.inputElem = null;
            // modal element
            self.modal = null;
            // define variable for popover when it is created
            self.popoverElem = null;
            // define active time element in popover e.g. hours of minutes
            self.activeTimeElem = null;
            // named array to hold time settings from input field data attributes
            self.timeSettings;
            // error handling array
            self.errors = {'userMessages' : [], 'appErrors' : {}};
           
            /**
            * Timeselect input timeselect keydown DOM event handle
            * THIS EVENT IS RUNS FIRST TO CREATE TIME SELECT MODAL
            */
            self.runInputFocus = function(event) {
                 self.htmlElem = event.target;
                // if element contains timeselect class e.g. timeselect input 
                // and modal is not initialised e.g. displayed
                if(self.htmlElem.classList.contains('timeselect') && !self.initialised){
                    //set current timeselect input element as an event triger
                    self.inputElem = self.htmlElem;
                    // set up any constraints specified in
                    if (setTimeSettings()) {
                        init(self.htmlElem);
                    // if incorrect settings of input display error
                    } else {
                        var inputDataErrors = '';
                        for (var key in self.errors.appErrors) {
                            inputDataErrors += self.errors.appErrors[key];
                            console.log(self.errors.appErrors);
                        }
                        console.log('User errors');
                        console.log(inputDataErrors);
                        self.inputElem.value = inputDataErrors;
                    }
                //if event triger is timeselect input and modal is initialised
                } else if (self.htmlElem.classList.contains('timeselect') && self.initialised) {
                   // if event target is not active input element e.g. different input element to previous
                    if (self.htmlElem != self.inputElem) {
                        removeTimeSelect();
                        self.inputElem = self.htmlElem;
                        setTimeSettings();
                        init(self.htmlElem);
                    // if clicked input is itself
                    } else if (self.htmlElem == self.inputElem) {
                        setCursor();
                    }
                }
            }

             /**!!TODO (
                -dismiss modal onclick .t-close
                -click outside of modal
            )
            * Timeselect window.onclick DOM event handle
            */
            self.runWindowClick = function (event) {
                self.htmlElem = event.target;
                /*TESTING*/
                // console.log('self.htmlElem:');
                // console.log(self.htmlElem);
                // console.log('self.activeTimeElem:');
                // console.log(self.activeTimeElem);
                // console.log('self.inputElem:');
                // console.log(self.inputElem);
                // console.log('self.modal:');
                // console.log(self.modal);
                // console.log('self.initialised:');
                // console.log(self.initialised);
                // console.log('isModal:');
                // console.log(isModal(self.htmlElem));
                // console.log('is input: ');
                // console.log(self.htmlElem == self.inputElem);

                //if event target is modal itself or it's child element EXEPT for arrow and timefield elems
                if ((self.htmlElem.id == 't-modal-container' || (isModal(self.htmlElem) && ! self.htmlElem.classList.contains('t-close'))) && self.activeTimeElem !== null) {
                    setCursor();
                // } else if () {
                // if element is not timeselect popover or not active timeselect input and timeselect is already initialised
                } else if ( self.htmlElem.classList.contains('t-close') || ! isModal(self.htmlElem || self.htmlElem.id == 't-modal') && self.htmlElem != self.inputElem && self.initialised) {
                    //reset Timeselect to default
                    removeTimeSelect();
                }
            } 

            /**
            * Timeselect input timeselect keydown DOM event handle
            */  
            self.runKeydown = function(event) {

                var keyCode = event.keyCode;
                //keysCodes for action keys
                var keyAction = {'up': 38, 'down': 40, 'left': 37, 'right':39, 'tab': 9, 'enter': 13, 'esc': 27};
                // keyCode array of number keys to be allowed
                var keyNumbers = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105];
                //if keyCode is not tab
                if(keyCode != keyAction.tab) {
                    event.preventDefault();

                    if( keyNumbers.indexOf(keyCode) != -1) {

                    } else {
                        switch (keyCode) {
                            case keyAction.up:
                                if(self.activeTimeElem != null && self.activeTimeElem.id == 't-modal-hour') {
                                    updateHour('up');
                                } else if (self.activeTimeElem != null && self.activeTimeElem.id == 't-modal-minute') {
                                    updateMinute('up');
                                }
                                break;
                            case keyAction.down:
                                 if(self.activeTimeElem != null && self.activeTimeElem.id == 't-modal-hour') {
                                    updateHour('down');
                                } else if (self.activeTimeElem != null && self.activeTimeElem.id == 't-modal-minute') {
                                    updateMinute('down');
                                }
                                break;
                            case keyAction.left:
                                if (self.activeTimeElem != null){
                                    setCursor();
                                }
                                break;
                            case keyAction.right:
                                if (self.activeTimeElem != null){
                                    setCursor();
                                }
                                break;
                            case keyAction.enter:
                                break;
                            case keyAction.esc:
                                // close timeselect if opened
                                if(self.initialised) {
                                    removeTimeSelect();
                                }
                                break;
                            default:
                                break;
                        }
                    }
                // moving from one input into another
                } else if (keyCode == keyAction.tab) {
                    if(self.initialised) {
                        removeTimeSelect();
                    }
                }
            } 
            /**
            * Timeselect -> init function
            * Initialise Timeselect variables values, call timeselect popover constructor*/
            function init(el) {
                appendTimeselect(el);
                self.initialised = true;
                //data atribute to identify active input field when use multiple timeselect inputs
                //if this is first timeselect input being selected
                if (!self.inputElem.classList.contains('timeselect-active')) {
                    if (clearAllClassName('timeselect', 'timeselect-active')){
                        self.inputElem.classList.add('timeselect-active');
                    }
                } 
                //set starting popover active elem as hours
                self.activeTimeElem = document.getElementById('t-modal-hour');
                setCursor(true);
            }

            /**!!!TODO (conditions to display above or bellow)
            * Timeselect -> appendTimeselect function
            * Add time select popover to DOM tree */
            function appendTimeselect(el) {
                //if popover NOT exists
                if(document.getElementById('t-modal') === null) {
                    // generate modal and append to body
                    var timeselectHtml = generateTimeSelectHtml(self.inputElem);
                    var theBodyElem = document.getElementsByTagName('body')[0];
                    theBodyElem.insertAdjacentHTML('beforeend', timeselectHtml);
                    // Assign modal element
                    self.modal = document.getElementById('t-modal-container');
                    /*
                    * Add click listeners to various elements of popover
                    * Has to be repeated every time on creation as all elements are destroyed
                    * after popover is removed*/
                    // modal elements displaying time number ither Hours or minutes called - t-timefield 
                    var timeElements = document.getElementsByClassName('t-timefield');
                    //Time elements when clicked become focused through assignment of the t-focused class
                    for (var i = 0; i < timeElements.length; i++) {
                        timeElements[i].addEventListener('click', function(event) {
                            event.stopPropagation();
                            // self.activeTimeElem = event.target;
                            selectActiveTimeElement(event);
                            setCursor(true);
                        }, false); 
                    }
                    var timeElementUpHour = document.getElementById('t-arrow-up-hour');
                    timeElementUpHour.addEventListener('click', function(event) {
                        event.stopPropagation();
                        selectActiveTimeElement('t-modal-hour');
                        updateHour('up');
                        setCursor(true);
                    }, false);

                    var timeElementDownHour = document.getElementById('t-arrow-down-hour');
                    timeElementDownHour.addEventListener('click', function(event) {
                        event.stopPropagation();
                        selectActiveTimeElement('t-modal-hour');
                        updateHour('down');
                        setCursor(true);
                    }, false);

                    var timeElementUpMinute = document.getElementById('t-arrow-up-minute');
                    timeElementUpMinute.addEventListener('click', function(event) {
                        event.stopPropagation();
                        selectActiveTimeElement('t-modal-minute');
                        updateMinute('up');
                        setCursor(true);
                    }, false);
                    var timeElementDownMinute = document.getElementById('t-arrow-down-minute');
                     timeElementDownMinute.addEventListener('click', function(event) {
                        event.stopPropagation();
                        selectActiveTimeElement('t-modal-minute');
                        updateMinute('down');
                        setCursor(true);
                    }, false);
                }
            }

            /**
            * Timeselect -> removeTimeSelect function
            * Remove time select popover*/
            function removeTimeSelect(){
                //remove popover elements from DOM
                document.getElementById('t-modal').remove();
                // remove active class from input
                clearAllClassName('timeselect', 'timeselect-active');
                self.modal = null;
                self.initialised = false;
                self.timeSettings = [];
                // remove focus from active input
                self.inputElem.blur();
                self.inputElem = null;
                self.activeTimeElem = null;
                // reset errors
                self.errors = {'userMessages' : [], 'appErrors' : {}};
            }

             /**
            * Timeselect -> selectActiveTimeElement function
            * Function selects current time element being updated of timeselect popover 
            * @param {String/ DOM obj} arg - can be ither string of one of predefined id names 
            *                or specific popover time element event.target
            * */
            function selectActiveTimeElement(arg) {
                var timeElem = arg == 't-modal-hour' || arg == 't-modal-minute' ? document.getElementById(arg) : arg.target;
                self.activeTimeElem = timeElem;
                // add active element timeselect variable
                clearAllClassName('t-timefield', 't-timefield-focused');
                timeElem.classList.add('t-timefield-focused');
            }

            /**
            * Timeselect -> setCursor function
            * Function changes position of active time selection in input and popover
            * if clicked on already active input field
            * @param {Boolean} explicit - states to set time fields to current self.activeTimeElem
            */
            function setCursor(explicit = false){
                // default behaviour of setCursor to alternate active time objects states
                if(!explicit && self.activeTimeElem.id == 't-modal-hour'){
                    self.inputElem.setSelectionRange(3,5);
                    selectActiveTimeElement('t-modal-minute');
                    self.activeTimeElem = document.getElementById('t-modal-minute');
                } else if (!explicit && self.activeTimeElem.id == 't-modal-minute') {
                    self.inputElem.setSelectionRange(0,2);
                    selectActiveTimeElement('t-modal-hour');
                    self.activeTimeElem = document.getElementById('t-modal-hour');
                }

                //explicitly set up time filed and input field position according to self.activeTimeElement
                if(explicit && self.activeTimeElem.id == 't-modal-hour'){
                    self.inputElem.setSelectionRange(0,2);
                    selectActiveTimeElement('t-modal-hour');
                } else if (explicit && self.activeTimeElem.id == 't-modal-minute') {
                    self.inputElem.setSelectionRange(3,5);
                    selectActiveTimeElement('t-modal-minute');
                }
            }

            /*
            * Timeselect -> isModal function
            * Check if event target element is part of popover HTML
            * @param {DOM obj} el - element to check
            */
            function isModal(el){
                //if element is not modal container itself check if it is it's decendant
                var isDescendantElem = self.modal != el ? isDescendant(self.modal, el) : true;
                if(el.id == 't-modal-container' || isDescendantElem) {
                   return true;
                }
                return false;
            }

            /** 
            think of better  timeselectHour.innerHTML validation false value)
            * Timeselect -> updateHour function
            * function update hours popover values and input field values
            * @param {String} arrowEvent - either 'up' or 'down'
            * */
            function updateHour(arrowEvent) {
                var actionComplete = false;
                var timeselectHour = document.getElementById('t-modal-hour');
                //if hour timefield is active and arrowEvent was assigned
                if(timeselectHour.classList.contains('t-timefield-focused') && arrowEvent){
                    var timeselectHourVal = timeselectHour.innerHTML; 
                    // variable to hold result of time validation expected: valid string or false
                    var timeValidation;
                    var constraints = {};
                    constraints.subject = 'hour';
                    constraints.hour = (typeof self.timeSettings.hour != 'undefined') ? self.timeSettings.hour : undefined;
                 
                    timeValidation = timeValidator(timeselectHourVal, arrowEvent, constraints); 
                    timeselectHour.innerHTML = timeValidation ? timeValidation : 'err';
                    actionComplete =  timeValidation ? true : false;
                } 
                if (actionComplete) { 
                    inputUpdate('hour', timeValidation);
                    displayUserMessage();
                };
                return actionComplete;
            }

            /**
            * Timeselect -> updateMinute function
            *function update minutes popover values and input field values
            * */
            function updateMinute(arrowEvent) {
            var actionComplete = false;
                var timeselectMinute = document.getElementById('t-modal-minute');
                if(timeselectMinute.classList.contains('t-timefield-focused') && arrowEvent){
                    var timeselectMinuteVal = timeselectMinute.innerHTML; 
                     // variable to hold result of time validation expected: valid string or false
                    var timeValidation;
                    var constraints = {};
                    constraints.subject = 'minute';
                    constraints.minute = (typeof self.timeSettings.minute != 'undefined') ? self.timeSettings.minute : undefined;
                    constraints.step = (typeof self.timeSettings.step != 'undefined') ? self.timeSettings.step : undefined;
                 
                    timeValidation = timeValidator(timeselectMinuteVal, arrowEvent, constraints); 
                    timeselectMinute.innerHTML = timeValidation ? timeValidation : 'err';
                    actionComplete =  timeValidation ? true : false;
                } 
                if (actionComplete) { 
                    inputUpdate('minute', timeValidation);
                    displayUserMessage();
                };
                return actionComplete;
            }

            /**
            * Timeselect -> timeValidator function
            * function validates time input
            * @param {int} timeValue - veriable to validate
            * @param {String} action - type of action e.g 'up' or 'down'
            * @param {Object} timeConstraints - named array contains: 
                                    required - 'subject' : ['hour'||'minute'], optioonal - 'hour'||'minute'||'step' : [min || max]
            * @param {String} inputMethod  - specifies weather imput was performed using:
                                    arrows keys - 'keys' or numbers - 'numbers'. Default is - 'keys'
            * @return {String/Boolean} validationResult - ither valid strig or false (if validation failed)
                                    IF VALIDATION FAILED self.errors timeselect variable will be updated with error message
                                    which is used to display to user
            */
            function timeValidator(timeValueStr, action, timeConstraints, inputMethod = 'keys') {
                // parse time in to integer
                var timeValueInt = parseInt(timeValueStr);
                var validationResult = false;
                // array of strings used for time notation
                var validTimeStrings = [];
                //variable to define number of values in each array of hour and minute
                var timeSubjects = {'hour':24, 'minute':60};
                // step minutes if defined
                var step = (typeof timeConstraints.step) != 'undefined' ? timeConstraints.step : false;
                // min max constrains
                if(typeof timeConstraints[timeConstraints.subject] != 'undefined') {
                    // array of strings after constrains are applied
                    var constraintTimeStrings = [];
                    var minTime = timeConstraints[timeConstraints.subject].min;
                    var maxTime = timeConstraints[timeConstraints.subject].max;
                    // Time string representation of min and max 
                    var minTimeStr = minTime.toString().length == 1 ? '0'+minTime.toString() : minTime.toString();
                    var maxTimeStr = maxTime.toString().length == 1 ? '0'+maxTime.toString() : maxTime.toString();
                }
                // fill up relevant array with strings 
                for (var i = 0; i < timeSubjects[timeConstraints.subject]; i++) {
                    // create array of all valid time string when constraint is not applyed
                    validTimeStrings.push(i.toString().length == 1 ? '0'+i.toString() : i.toString());
                    //build array of constrained strings if constrain exist
                    if(typeof minTime != 'undefined' && typeof maxTime != 'undefined' ) { 
                        if( minTime < maxTime && (i >= minTime && i <= maxTime)) {
                            constraintTimeStrings.push(i.toString().length == 1 ? '0'+i.toString() : i.toString());
                        } else if ( minTime > maxTime && (i <= maxTime || i >= minTime) ) {
                            constraintTimeStrings.push(i.toString().length == 1 ? '0'+i.toString() : i.toString()); 
                        }
                    }
                }
                // set up step variables
                if (step) {
                    var timeValPlusStepStr;
                    var timeValMinusStepStr; 
                    if ( action == 'up'){
                        if(( timeValueInt + step ) > 59 ) {
                            timeValPlusStepStr = '00';
                        } else {
                            timeValPlusStepStr = (timeValueInt + step).toString().length == 1 ? '0'+(timeValueInt + step).toString() : (timeValueInt + step).toString();
                        }
                    } else if (action == 'down') {
                        if(( timeValueInt - step ) < 1 ) {
                            timeValMinusStepStr = '00';
                        } else {
                            timeValMinusStepStr = (timeValueInt - step).toString().length == 1 ? '0'+(timeValueInt - step).toString() : (timeValueInt - step).toString();
                        }
                    }

                    var maxTimeStepStr; 
                    if((maxTime + 1) < 59) {
                       maxTimeStepStr = (maxTime + 1).toString().length == 1 ? '0'+(maxTime + 1).toString() : (maxTime + 1).toString();
                    } else {maxTimeStepStr = '00';}

                    var minTimeStepStr; 
                    if((minTime - 1) >= 0 ) {
                       minTimeStepStr = (minTime - 1).toString().length == 1 ? '0'+(minTime - 1).toString() : (minTime - 1).toString();
                    } else {minTimeStepStr = '59';}
                }
                // testing variables     
                switch (timeConstraints.subject) {
                    case 'hour':
                        // Time constraint data is defined in the input field
                        if(typeof constraintTimeStrings != 'undefined') {
                            /*value is within constraint*/
                            if (constraintTimeStrings.indexOf(timeValueStr) != -1 ) {
                                if (timeValueStr != minTimeStr  && action == 'down') {
                                    validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                                } else if (timeValueStr != maxTimeStr && action == 'up'){ 
                                    validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                                } else {
                                    //User error message set
                                    validationResult = timeValueStr;
                                     self.errors['userMessages'].push('Time constrains: HOUR min-'+minTimeStr+', max-'+maxTimeStr);
                                }
                            }
                        // no time constraints
                        } else {
                             validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                        }
                        break;
                    case 'minute':
                        // Time constraint data is defined in the input field
                        if(typeof constraintTimeStrings != 'undefined') {
                            // value is within constraint array string
                            if (constraintTimeStrings.indexOf(timeValueStr) != -1) {
                                // no step constraint
                                if (!step && timeValueStr != minTimeStr  && action == 'down') {
                                    validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);  

                                } else if (step && timeValMinusStepStr != minTimeStepStr && action == 'down'){
                                    if (constraintTimeStrings.indexOf(timeValMinusStepStr) != -1 ){
                                        validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                                    } else if (constraintTimeStrings.indexOf(timeValMinusStepStr) == -1 ) {
                                        validationResult = timeValueStr;
                                        self.errors['userMessages'].push('Time constrains: min-'+minTimeStr+', max-'+maxTimeStr);
                                    } 
                                }else if (step && timeValMinusStepStr == minTimeStepStr && action =='down') {
                                    validationResult = timeValueStr;
                                    self.errors['userMessages'].push('Time constrains:  min-'+minTimeStr+', max-'+maxTimeStr);
                                } else if (!step && timeValueStr != maxTimeStr && action == 'up'){ 
                                    validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                                } else if(step && timeValPlusStepStr != maxTimeStepStr && action =='up') {
                                    if (constraintTimeStrings.indexOf(timeValPlusStepStr) != -1 ){
                                        validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                                    } else if (constraintTimeStrings.indexOf(timeValPlusStepStr) == -1 ) {
                                         validationResult = timeValueStr;
                                         self.errors['userMessages'].push('Time constrains: min-'+minTimeStr+', max-'+maxTimeStr);
                                    } 
                                } else if(step && timeValPlusStepStr == maxTimeStepStr && action =='up') {
                                    validationResult = timeValueStr;
                                    self.errors['userMessages'].push('Time constrains: min-'+minTimeStr+', max-'+maxTimeStr);
                                } else {
                                    validationResult = timeValueStr;
                                     self.errors['userMessages'].push('Time constrains: min-'+minTimeStr+', max-'+maxTimeStr);
                                }
                            }
                        } else {
                             validationResult = timeValidatorHelper(timeValueInt, validTimeStrings, action, step);
                        }
                        break;
                }
                return validationResult;
            }

            /**
            * TimeValidator -> TimeValidatorHelper function
            * function performs increment and decrement on time string by traversing time string set
            * @param {Int} timeValueInt - 
            * @param {Array} validTimeStrings - array of valid time strings
            * @param {String} operation - 'add' or 'subtract'
            * @return {String} validationResult
            */
            function timeValidatorHelper(timeValueInt, validTimeStrings, operation = false, step = false) {
                var validationResult;
                // if step is defined use it else use 1
                var step = step ? step : 1;
                if(operation == 'up') {
                    //not outside of array's last index
                    if(timeValueInt + step < validTimeStrings.length) {
                        validationResult = validTimeStrings[timeValueInt + step];
                    //reached end of array skip back to array beginning
                    } else if (timeValueInt + step == validTimeStrings.length) {
                        validationResult = validTimeStrings[0];
                    } else if (timeValueInt + step > validTimeStrings.length) {
                        validationResult = '00';
                    }
                } else if (operation == 'down') {
                    //not begining of the array
                    if(! (timeValueInt - step < 0)) {
                        validationResult = validTimeStrings[timeValueInt - step];
                    //reached beginning of array skip back to array end
                    } else if (timeValueInt - step < 0) {
                        validationResult = validTimeStrings[validTimeStrings.length - step];
                    }
                //no operation - return current string
                } else {
                    validationResult = validTimeStrings[timeValueInt];
                }

                return validationResult;
            }

            /**
            * Timeselect ->setTimeSettings function
            * Extracts current input field (self.inputElem) time settings if any and assigns to self.timeSettings variable 
            */
            function setTimeSettings() {
                self.timeSettings = [];
                // check if user set timesettings are what was expected
                var noErrors = true; 
                // list of available data atributes
                var settingsSet = ['hour', 'minute', 'step'];
                var settingsConstraints = {
                    'hour': [0, 23],
                    'minute' : [0, 59],
                    'step' : ['5', '10', '15']
                }
                var tempTimeSettinsArray = [];
                for (var i = 0; i < settingsSet.length; i++) {
                    if(settingsSet[i] != 'step') {
                        // assign hours settings and minutes
                        if (typeof self.inputElem.dataset[settingsSet[i]] != 'undefined') {
                            tempTimeSettinsArray = self.inputElem.dataset[settingsSet[i]].split(',');
                            if (tempTimeSettinsArray.length == 2) {
                                if((settingsSet[i] == 'hour' && parseInt(tempTimeSettinsArray[0]) >= settingsConstraints.hour[0] && parseInt(tempTimeSettinsArray[0]) <= settingsConstraints.hour[1] && parseInt(tempTimeSettinsArray[1]) >= settingsConstraints.hour[0] && parseInt(tempTimeSettinsArray[1]) <= settingsConstraints.hour[1]) || (settingsSet[i] == 'minute' && parseInt(tempTimeSettinsArray[0]) >= settingsConstraints.minute[0] && parseInt(tempTimeSettinsArray[0]) <= settingsConstraints.minute[1] && parseInt(tempTimeSettinsArray[1]) >= settingsConstraints.minute[0] && parseInt(tempTimeSettinsArray[1]) <= settingsConstraints.minute[1] )) {
                                    // create first level of named array
                                    self.timeSettings[settingsSet[i]] = {};
                                    self.timeSettings[settingsSet[i]]['min'] = parseInt(tempTimeSettinsArray[0]); 
                                    self.timeSettings[settingsSet[i]]['max'] = parseInt(tempTimeSettinsArray[1]); 
                                } else {
                                    noErrors = false;
                                    self.errors.appErrors['setTimeSettings'] = 'incorrect data-'+settingsSet[i]+' format';
                                }
                            } else {
                                noErrors = false;
                                self.errors.appErrors['setTimeSettings'] = 'incorrect data-'+settingsSet[i]+' format';
                            }
                        }
                    // assign minutes step settings
                    } else {
                        if (typeof self.inputElem.dataset[settingsSet[i]] != 'undefined') {
                            // if step has specific values
                            if (settingsConstraints.step.indexOf(self.inputElem.dataset[settingsSet[i]]) != -1) {
                                self.timeSettings[settingsSet[i]] = parseInt(self.inputElem.dataset[settingsSet[i]]);
                            } else {
                                noErrors = false;
                                self.errors.appErrors['setTimeSettings'] = 'incorrect data-'+settingsSet[i]+' format';

                            }
                        }
                    }
                }
                return noErrors;
            }

           

            /*
            * Timeselect -> clearAllFocused function
            * remove all specified class name's from elements with specified class selector
            * @param {String} elem - class name of elements perform action on 
            * @param {String} className - class na
            */
            function clearAllClassName(targetClass = null, removeClassName = null) {
                if((!targetClass instanceof String || !removeClassName instanceof String) || (targetClass === null || removeClassName === null)){
                    // remove line bellow if importing function
                    self.errors.appErrors['clearAllClassName()'] = "invalid arguments";
                    return false;    
                }
                try {
                    var targetElements = document.getElementsByClassName(targetClass);
                    for (var i = 0; i < targetElements.length; i++) {
                        if(targetElements[i].classList.contains(removeClassName)){
                            targetElements[i].classList.remove(removeClassName);
                        }
                    }
                    return true;
                } catch(error) {
                    console.log('clearAllClassName() error: '+ error);
                    return false;
                }
            }

            /**
            * TImeselect -> inputUpdate funciton
            * Update input with values from timeselect
            * @param {String} timeField - 
            * @param {String} value -  
            */
            function inputUpdate(timeField, value) {
                // get input value string and create array ['hh', 'mm']
                var inputValueStrings = self.inputElem.value.split(':');
                //focus selection back in place after update
                var resetIinputHigllight = [];
                switch (timeField) {
                    case 'hour':
                        inputValueStrings[0] = value;
                        resetIinputHigllight = [0, 2];
                        break;
                    case 'minute':
                        inputValueStrings[1] = value;
                        resetIinputHigllight = [3, 5];
                        break;
                }
                self.inputElem.value = inputValueStrings[0]+':'+inputValueStrings[1];
                self.inputElem.setSelectionRange(resetIinputHigllight[0],resetIinputHigllight[1]);
            }

            /**
            * displayUserMessage function
            * Diplay relevant time error message
            */
            function displayUserMessage() {
                var modalFooter = document.getElementById('t-modal-footer');
                // input field error message
                var inputErrorMsgElem = getThisInputError(self.inputElem) ? getThisInputError(self.inputElem) : false;
                console.log(self.errors);
                //if there are time select constraint errors
                if(self.errors.userMessages.length != 0){
                    // change colour of active time field
                    self.activeTimeElem.classList.add('t-timefield-error');
                    // change color of the input field
                    self.inputElem.classList.add('timeselect-active-error')
                    // add error message span with class timeselect-error-message
                    modalFooter.insertAdjacentHTML('beforeend', '<p class="t-modal-error-msg">'+self.errors.userMessages+'</p>');
                    // if no errors exist create element to display them
                    if (! inputErrorMsgElem) {
                        self.inputElem.insertAdjacentHTML('afterend', '<span class="timeselect-error-msg">'+self.errors.userMessages+'<br></span>');
                    // error msg elem exist -> append new msg to it
                    } else {
                        inputErrorMsgElem.innerHTML = inputErrorMsgElem.innerHTML + self.errors.userMessages +'<br>';
                    }
                    // reset error messages after being displayed
                    self.errors = {'userMessages' : [], 'appErrors' : {}};
                } else if (self.errors.userMessages.length == 0) {
                    self.activeTimeElem.classList.remove('t-timefield-error');
                    self.inputElem.classList.remove('timeselect-active-error')
                    // remove error messages from modal footer field
                    modalFooter.innerHTML= '';
                    if (inputErrorMsgElem ) {
                        inputErrorMsgElem.remove();
                    }
                }
            }

            /**
            * 
            *
            */
            function (){

            }
        /* END Timeselect obj */
        }
        
        /*-----------------------------------------------------------*
        * Timeselect specific functions
        *------------------------------------------------------------*/
        /**
        * getThisInputError function
        * Gets input error message span of specific input elem
        * @param {DOM obj} inputElem - subject input element
        */
        function getThisInputError(inputElem) {
            var inputNextSibling = inputElem.nextElementSibling;
            if (inputNextSibling.classList.contains('timeselect-error-msg')){
                return inputNextSibling;
            } else { return false;}
        }

        /*
        * inputSetInitialValue function
        * Set starting value of each timeselect input on page load
        * @param {DOM obj} el - input element
        */
        function inputSetInitialValue(el) {
            var inputValues = []
            if(typeof el.dataset.hour != 'undefined') {
                var minHour = el.dataset.hour.split(',')[0];
                inputValues.push(minHour.toString().length == 1 ? '0'+minHour.toString() : minHour.toString());
            } else {
                inputValues.push('hh');
            }
            if(typeof el.dataset.minute != 'undefined') {
                var minMinute = el.dataset.minute.split(',')[0];
                inputValues.push(minMinute.toString().length == 1 ? '0'+minMinute.toString() : minMinute.toString());
            } else {
                inputValues.push('mm');
            }
            el.value = inputValues[0]+":"+inputValues[1];
        }

        /*!!TODO top position is not calculated properly
        * generateTimeSelectHtml function
        * Function generates html element of the timeselect popover and assigns top position  
        * to it related to input elem that is calling it
        */
        function generateTimeSelectHtml(inputElem) {
            // check value of input field initiated
            var inputValuesArr = inputElem.value.split(':');
            var hour = inputValuesArr[0] == 'hh' ? '00' : inputValuesArr[0];
            var minute = inputValuesArr[1] == 'mm' ? '00' : inputValuesArr[1];
            
            return `<div id="t-modal">
              <div id="t-modal-container" class=""> 
                <div id="t-modal-header">
                    <span id="t-input-name">`+inputElem.label.innerHTML+`</span>
                    <span class="t-close">x</span>
                </div>
                <hr>
                <div id="t-modal-body">
                    <div>
                        <span id="t-modal-hour" class="t-timefield">`+hour+`</span>
                        <span id="t-arrow-up-hour" class="t-arrow-up">&#8743;</span>
                        <span id="t-arrow-down-hour" class="t-arrow-down">&#8744;</span>
                    </div>
                    <div>
                        <span id="t-modal-colon">:</span>
                    </div>
                    <div>
                        <span id="t-modal-minute" class="t-timefield">`+minute+`</span>
                        <span id="t-arrow-up-minute" class="t-arrow-up">&#8743;</span>
                        <span id="t-arrow-down-minute" class="t-arrow-down">&#8744;</span>
                    </div>
                </div>
                <hr>
                <div id="t-modal-footer">
                </div>
            </div>
        </div>`;
        } 
         /**
        * checkSiblings() function - check if event node has as it's sibling or it's parrent's sibling t-focused 
        * @param {DOM obj} el - event node of siblings
        * @return {Boolean}
        */
        function checkSiblings(el) {
            // avoid wrong input
            if(typeof el == 'undefined' || el == null) { 
                console.log('<!>checkSiblings() - element is undefined/null' );
                return false;
            }
            // asume that element is not asibling of t-focused
            var isSibling = false;
            // get parent element and it's siblings of the argument element
            var parentSiblings = getSiblings(el.parentElement, 'span');
            //get siblings of the argument element
            var tfocusedSiblings = getSiblings(el, 'span');
            //check if element is child of span sibling of t-timefield-focused e.g. <span><i></i></span>
            // if there are span parent elements and number of 3
            if (parentSiblings.length == 3) {
                for (var i = 0; i < parentSiblings.length; i++) {
                   if( parentSiblings[i].classList.contains('t-timefield-focused')) { isSibling = true;} 
                }
            // check if element is sibling of t-timefield-focused
            } else if(tfocusedSiblings.length == 3){
                for (var i = 0; i < tfocusedSiblings.length; i++) {
                    if (tfocusedSiblings[i].classList.contains('t-timefield-focused')) {isSibling = true;}
                }                
            }
            return isSibling;
        }
    /*END check if timeselect class name */
    } else {
        console.log("Timeselect: NOT FOUND Input field with class name timeselect.");
    }

        /*-----------------------------------------------------------*
        * Helper Functions 
        *------------------------------------------------------------*/
        /**
        * IsDescendant() function - checks if elements has child parent raltionship 
        * Also works with nested elements
        * @param {DOM obj} parent - parent element
        * @param {DOM obj} child - child of parent element
        * @return {Boolean}
        */
        function isDescendant(parent, child) {
            //can not be decandant of yourself
            if (parent == child) { return false; } 
             var node = child.parentNode;
             while (node != null && typeof node != 'undefined') {
                 if (node == parent) {
                     return true;
                 }
                 node = node.parentNode;
             }
             return false;
        }
        
        /**
        * getSiblings function - returns array of siblings from element of specific tag name
        * @param {DOM obj} el - parent node of the siblings
        * @param {String} filter - element tag name of siblings required
        * @return {Array} array of DOM objects
        */
        function getSiblings(el, filter) {
            if (el !== null) {
                var siblings = [];
                // first child of element
                el = el.parentNode.firstChild;
                do { 
                    // check if filter is defined and current child element tag name is same as filter string
                    if (!filter || filterSiblings(el, filter)) {
                        siblings.push(el);
                    } 
                // iterate through each child untill return null
                } while (el = el.nextSibling);
                return siblings;
            }
            return false;
        }
        /** !!!TODO (incorporate in to getSiblings)!!!
        * filterSiblings (Helper function of getSiblings())
        * @param {DOM obj} el - element which tag name to be compared to filter strin
        * @param {String} filter - string to be validated as an elemnt tag name 
        * @return {Bolean}  
        */
        function filterSiblings(el, filter) {
            var filter = filter.toUpperCase();
            return el.nodeName == filter;
        }
        /**
        * setInputLabelProp function - scans DOM for label tags and assigns them to 
        * associated input element's label property e.g input.label => label element 
        */
        function setInputLabelProp() {
            var labels = document.getElementsByTagName('LABEL');
            for (var i = 0; i < labels.length; i++) {
                if (labels[i].htmlFor != '') {
                     var elem = document.getElementById(labels[i].htmlFor);
                     if (elem)
                        elem.label = labels[i];         
                }
            }
        }
        /*Exlisive OR logical operator*/
        function xOR(a,b) {
            return ( a || b ) && !( a && b );
        }
}  