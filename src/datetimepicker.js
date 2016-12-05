(function($){
  var system_options = {
    lang: {
      en: { //English
        dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        dayOfWeekShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
        month: ["January","February","March","April","May","June","July","August","September","October","November","December"]
      },
      de: { //Deutsch
        dayOfWeek: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
        dayOfWeekShort: ["So","Mo","Di","Mi","Do","Fr","Sa"],
        month: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
      }
    },
    style: { //Defines class of overall DateTimePicker to set different styles
      default: ''
    },
  };

  //Holds min/max values and other settings
  var validation = {
    time: {
      hours: {
        min: 0,
        max: 23
      },
      minutes: {
        min:0,
        max:59
      }
    }
  }

  //Holds our default options, will be updated based on user-set options
  var default_options = {
    lang: "en",
    multiple: false,
    style: "default",
    defaultTime: {
      hours: 12,
      minutes: 0
    },
    timeIncrement: {
      hours: 1,
      minutes: 5
    },
    defaultMonth: "",
    defaultYear: "",
    allowPast: false,
    buttonText: "Select Date",
    startDay: "0", //Day of the week to begin the weeks on
    calendarSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 20h-4v-4h4v4zm-6-10h-4v4h4v-4zm6 0h-4v4h4v-4zm-12 6h-4v4h4v-4zm6 0h-4v4h4v-4zm-6-6h-4v4h4v-4zm16-8v22h-24v-22h3v1c0 1.103.897 2 2 2s2-.897 2-2v-1h10v1c0 1.103.897 2 2 2s2-.897 2-2v-1h3zm-2 6h-20v14h20v-14zm-2-7c0-.552-.447-1-1-1s-1 .448-1 1v2c0 .552.447 1 1 1s1-.448 1-1v-2zm-14 2c0 .552-.447 1-1 1s-1-.448-1-1v-2c0-.552.447-1 1-1s1 .448 1 1v2z"/></svg>',
    timeSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 14h-7v-8h2v6h5v2z"/></svg>',
    inputName: 'DateTimePicker' //Used to prepend hidden input id's. Will be set to element ID if exists and not set by user
  };

  var today = getCurrentDate();
  var element;

  var selected = { //Selected calendar day element
    dates: [],
    time: {
      hours: default_options.defaultTime.hours,
      minutes: default_options.defaultTime.minutes
    }
  };

  function getCurrentDate(){
    var now = new Date();

    return {
      "date":now.getDate(),
      "dayOfWeek":system_options.lang[default_options.lang].dayOfWeek[now.getDay()],
      "dayOfWeekShort":system_options.lang[default_options.lang].dayOfWeekShort[now.getDay()],
      "month":system_options.lang[default_options.lang].month[now.getMonth()],
      "monthNum":now.getMonth(),
      "year":now.getFullYear()
    }
  };

  $.fn.dateTimePicker = function(options){
    element = this;
    initiateOptions();
    setOptions(options);

    createPicker();
    bindElements();
  };

  //Sets some default_options that need processing first
  function initiateOptions(){
    default_options.defaultMonth = today.monthNum;
    default_options.defaultYear = today.year;
  };

  //Takes user defined options and updates the default options where appropriate
  //Ignores any invalid options
  function setOptions(options){
    //Set language based on html lang setting. Will be overwritten by manually set option
    var html_lang = document.documentElement.getAttribute('lang');
    if(html_lang in system_options.lang){
      default_options.lang = html_lang;
    }

    //Iterate through keys given in users options
    for(var key in options){
      //Check not empty value
      var empty_test = options[key]+=""; //Convert to string to perform boolean test
      if(empty_test){ //If value not empty
        //If exists in default_options, these are user-definable options
        if(key in default_options){
          //If the key exists in system_options, we need to check that the parameter passed is also valid
          if(key in system_options){
            //If a valid option from system_options
            if(!(options[key] in system_options[key])) continue //Skips rest of loop if the key doesn't have a valid value within system_options
          }

          //Validation tests
          valid = false; //Presume invalidity
          switch(key){
            case 'defaultTime': //Only allows HH:MM format
              var hhmm_test = /([01]\d|2[0-3]):?([0-5]\d)/
              if(hhmm_test.test(options[key])){
                var time = options[key].split(":");
                options[key] = { //Turn defaultTime into object of hours and minutes
                  hours : parseInt(time[0]),
                  minutes : parseInt(time[1])
                }
                valid = true;
                //Update selected values to default to this
                selected.time.hours = options[key].hours;
                selected.time.minutes = options[key].minutes;
              }
              break;
            case 'allowPast':
            case 'multiple': //Only allows true/false in string, int and boolean versions
              var validOptions = [true, false, "true", "false", 0, 1, "0", "1"];
              if(validOptions.indexOf(options[key]) >= 0){
                if(options[key] == 0 || options[key] == 1 || options[key] == "0" || options[key] == "1"){
                  options[key] = !!+options[key];
                }
                console.log(key)
                console.log(options[key])
                valid = true;
              }
              break;
            default: //Any others that don't require validation, such as buttonText
              valid = true;
              break;
          };

          if(valid){
            default_options[key] = options[key]; //Update default_options values
          }
        }
      }
    }

    //Check if inputName has been changed, if not then check if element has an ID and set to that
    if(default_options.inputName == 'DateTimePicker'){
      if(element.attr('id')){
        default_options.inputName = element.attr('id');
      }
    }
  };

  function createPicker(){
    //Default layout elements
    var layout = {
      button: '<div class="button">' + default_options.buttonText + '</div>', //Button to open picker
      picker: '<div class="picker"></div>',
      loader: '<div class="loader"></div>',
      calendar_button: '<div class="button-calendar">' + default_options.calendarSVG + '</div>',
      calendar: '<article class="calendar"></article>',
      calendarMonthSpinner: '<div class="month-spinner"><div class="month-previous arrow-left"></div><div class="month-text"></div><div class="month-next arrow-right"></div></div>',
      calendarMonth: '<div class="month"></div>',
      calendarWeek: '<div class="week"><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div></div>',
      calendarDay: '<div class="day"></div>',
      time_button: '<div class="button-time">' + default_options.timeSVG + '</div>',
      time: '<article class="time"><div class="flex-wrap"></div></article>',
      timeColumn: '<div class="column"><div class="arrow-up"></div><div class="time"></div><div class="arrow-down"></div></div>',
      outputs: '<div class="outputs"></div>'
    }
    //Initiate element. Remove all existing classes and empty content
    element.empty().removeClass().addClass('DateTimePicker');

    element.append(layout.button);
    element.append(layout.picker);
    var picker = element.children('div.picker');
    picker.append(layout.loader); //Loading spinner

    //Add calendar
    picker.append(layout.calendar_button).append(layout.calendar);
    var calendar = picker.children('article.calendar');
    calendar.append(layout.calendarMonthSpinner);
    calendar.append(layout.calendarMonth);
    var calendarMonth = calendar.children('div.month');

    //Add week header row based on user options
    calendarMonth.append(layout.calendarWeek);
    calendarMonth.children('div.week').addClass('header');
    var day = default_options.startDay;
    for(var i=0; i<7; i++){
      if(day == 7){
        day = 0;
      }
      calendarMonth.find('div.week.header > div.day').eq(i).text(system_options.lang[default_options.lang].dayOfWeekShort[day]);
      day++;
    };

    //Initiate calendar day squares
    for(var i=0; i<6; i++){
      calendarMonth.append(layout.calendarWeek);
    };

    //Add calendar days
    generateCalendar(default_options.defaultMonth, default_options.defaultYear,element);

    //Add time button
    picker.append(layout.time_button).append(layout.time);

    var time_wrap = picker.find('article.time > div.flex-wrap'); //Flex wrapper of time columns
    var time_string = outputTimeString();

    time_wrap.append(layout.timeColumn);
    time_wrap.children('div.column').addClass('hours').children('div.time').append(time_string.hours);
    time_wrap.append(layout.timeColumn);
    time_wrap.children('div.column:last-child').empty().append(':');
    time_wrap.append(layout.timeColumn);
    time_wrap.children('div.column:last-child').addClass('minutes').children('div.time').append(time_string.minutes);

    element.append(layout.outputs);
  };

  //Outputs HH:MM format time string with leading zeroes
  function outputTimeString(){
    //Convert both to strings first
    hours = selected.time.hours+"";
    minutes = selected.time.minutes+"";
    //Check they're not empty
    if(hours && minutes){
      //Validate digits Only
      var digits = new RegExp("\\d+");
      if(digits.test(hours) && digits.test(minutes)){
        if(hours.length == 1){
          hours = "0" + hours;
        }
        if(minutes.length == 1){
          minutes = "0" + minutes;
        }
        return {
          hours: hours,
          minutes: minutes
        }
      }
    }
    return false;
  }

  function generateCalendar(month,year,element){
    element.find('div.month-text').text(system_options.lang[default_options.lang].month[default_options.defaultMonth] + ' ' + default_options.defaultYear); //Set initial spinner month and year based on set options

    weeks = element.find('article.calendar div.week').not('.header');
    weeks.children('.day').empty().removeClass('prev-month next-month today selected past'); //Empty all existing day entries

    var first_day = new Date(year, month, 1).getDay(); //First weekday of selected month
    var last_date = new Date(year, month+1, 0).getDate(); //Last DATE of selected month
    var last_date_previous = new Date(year, month, 0).getDate(); //Last DATE of the previous month
    var current_day = 1 - first_day ; //Set to first day of current month for continuation
    var next_date = 1; //Used for numbering first days of next month in calendar

    //Loop through 6 rows of dates
    for(var w=0; w<6; w++){
      for(var d=0; d<7; d++){
        //Variables will be modified and used to test if the date exists in selected.
        //Needed for when previous/next month objects are selected
        var current_month = month;
        var current_year = year;
        var current_date = current_day;

        if((current_day > last_date) && w>=4 && d>0){ //If we're on the last row, but past the first cell and on the next month
          weeks.eq(w).children('div.day').eq(d).text(next_date).addClass('next-month');
          current_month++;
          current_date = next_date;
          next_date++;
        }else if((current_day > last_date) && w==5 && d==0){ //If we reach the first element of the last row and we're on the next month, remove the last row.
          weeks.eq(w).hide();
          break;
        }else if((w==0 && d >= first_day) || (w > 0 && current_day <= last_date)){ // If we're past the first weekday of the first of the month or within the date range
          weeks.eq(w).children('div.day').eq(d).text(current_day);
        }else if(current_day < 1){ //Previous month dates
          weeks.eq(w).children('div.day').eq(d).text(last_date_previous - first_day +1).addClass('prev-month');
          current_month--;
          current_date = last_date_previous - first_day +1;
          last_date_previous++;
        }

        if(current_month < 0){
          current_year =  testYear(current_year, current_month, 'prev').year;
        }else if(current_month > 11){
          current_year =  testYear(current_year, current_month, 'next').year;
        }

        //Add class to dates in the past.
        var current_full_date = new Date(year, month, current_day);
        var today_test = new Date(today.year, today.monthNum, today.date, 0, 0, 0, 0);
        if(current_full_date < today_test && !default_options.allowPast){
          weeks.eq(w).children('div.day').eq(d).addClass('past');
        }

        //If already selected
        if(checkSelected(current_year, current_month, current_date)){
          weeks.eq(w).children('div.day').eq(d).addClass('selected');
        }

        //Test if current day is today
        if(current_day == today.date && month == today.monthNum && year == today.year){
          weeks.eq(w).children('div.day').eq(d).addClass('today');
        }

        weeks.eq(5).show(); //Default to show the last row, will have broken out of loop if it's not supposed to be shown
        current_day++; //Always increment, starts at 1 minus the weekday number the month starts on
      }
    }
  }

  function bindElements(){
    //Bind button to show picker
    $('div.DateTimePicker > div.button').click(function(){
      $(this).siblings('div.picker').stop().fadeToggle(200);
    });

    //Left calendar arrow
    $('div.DateTimePicker > div.picker > article.calendar > div.month-spinner > div.month-previous').click(function(){
      var new_date = testYear(default_options.defaultYear, default_options.defaultMonth, 'prev');
      default_options.defaultYear = new_date.year;
      default_options.defaultMonth = new_date.month;

      parent = $(this).closest('div.DateTimePicker');
      generateCalendar(default_options.defaultMonth, default_options.defaultYear, parent);
    });

    //Right calendar arrow
    $('div.DateTimePicker > div.picker > article.calendar > div.month-spinner > div.month-next').click(function(){
      var new_date = testYear(default_options.defaultYear, default_options.defaultMonth, 'next');
      default_options.defaultYear = new_date.year;
      default_options.defaultMonth = new_date.month;

      parent = $(this).closest('div.DateTimePicker');
      generateCalendar(default_options.defaultMonth, default_options.defaultYear, parent);
    });

    //On calendar cell click
    $('div.DateTimePicker > div.picker > article.calendar > div.month > div.week:not(.header) div.day').click(function(){
      selectDate($(this));
    });

    /* Calendar article */
    $('div.DateTimePicker div.button-calendar').click(function(){
      $(this).siblings('article.time').stop().slideUp(200);
      $(this).siblings('article.calendar').stop().slideDown(200);
    })
    /* Time article */
    $('div.DateTimePicker div.button-time').click(function(){
      $(this).siblings('article.calendar').stop().slideUp(200);
      $(this).siblings('article.time').stop().slideDown(200);
    });

    //Hours/Minutes Increase
    $('div.DateTimePicker > div.picker > article.time div.column div.arrow-up, div.DateTimePicker > div.picker > article.time div.column div.arrow-down').click(function(){
      var column_type = $(this).closest('div.column').attr('class').split(' '); //Get column class, hours or minutes
      column_type.splice(column_type.indexOf("column"), 1); //Remove shared "column" class from array
      var action = $(this).attr('class'); //Gets 'arrow-up' or 'arrow-down'

      spinTime($(this).closest('article.time'), column_type, action);
    });

    //On time click (manual text entry)
    $('div.DateTimePicker article.time div.time').click(function(){
      if(!$(this).hasClass('edit-active')){
        createTextInput($(this))
      }
    })
  };

  //On date selection
  function selectDate(element){
    var test_date = {
      month : default_options.defaultMonth,
      year : default_options.defaultYear
    }
    //Test if element is a next or previous month button and adjust dates accordingly
    if(element.hasClass('prev-month')){
      test_date = testYear(test_date.year, test_date.month, 'prev');
    }else if(element.hasClass('next-month')){
      test_date = testYear(test_date.year, test_date.month, 'next');
    }

    if(!element.hasClass('past') || default_options.allowPast){
      var date = new Date(test_date.year, test_date.month, element.text());
      if(default_options.multiple){ //If multiple element selection allowed
        if(element.hasClass('selected')){ //If already selected, remove from array
          selected.dates.splice(selected.dates.map(Number).indexOf(+date), 1); //Serialised to compare indexOf date objects
          element.removeClass('selected');
        }else{
          element.addClass('selected');
          selected.dates.push(date);
        }
      }else{
        selected.dates.pop();
        element.closest('div.month').find('div.week:not(.header) div.day').removeClass('selected');
        element.addClass('selected');
        selected.dates.push(date);
      };
      updateButtonText(element);

      //Update outputs elements for each date
      updateOutputs(element);
    }
  }

  //Used to check if a date has already been selected
  function checkSelected(year, month, date){
    var full_date = new Date(year, month, date);
    if(selected.dates.map(Number).indexOf(+full_date) >= 0){ //Date object has to be serialised  to be compared
      return true;
    }
    return false;
  }

  //Test whether the year and month need to be changed if it's going back/forward a year
  //Valid 'test' parameters are 'prev' and 'next'
  function testYear(year, month, test){
    if(test === 'prev' || test === 'next'){
      switch(test){
        case 'prev':
          if(month <= 0){
            month = 11;
            year--;
          }else{
            month--;
          }
          break;
        case 'next':
          if(month >= 11){
            month = 0;
            year++;
          }else{
            month++;
          }
          break;
      }
      return {
        month: month,
        year: year
      }
    }
    return false; //Returns false if an invalid test parameter is passed
  };

  //Changes time spinners
  //Element is parent article.time, column is hours or minutes, action is arrow-up or arrow-down
  function spinTime(element, column, action){
    //Validate parameters
    if(element && (column == 'hours' || column == 'minutes') && (action == 'arrow-up' || action == 'arrow-down')){
      var time = element.find('div.' + column + ' > div.time');

      switch(action){
        case 'arrow-up': //Increase spinner
          var new_time = selected.time[column] + default_options.timeIncrement[column];
          if(new_time > validation.time[column].max){
            new_time = new_time - validation.time[column].max -1;
          }
          selected.time[column] = new_time;
          break;

        case 'arrow-down': //Decrease spinner
          var new_time = selected.time[column] - default_options.timeIncrement[column];
          if(new_time < validation.time[column].min){
            new_time = new_time + validation.time[column].max + 1;
          }
          selected.time[column] = new_time;
          break;
      }

      //Draw new values
      var new_time = outputTimeString();
      time.html(new_time[column]);
      updateButtonText(element);
      updateOutputs(element);
    }
    return false;
  }

  //Creates text input upon time click
  function createTextInput(element){
    var current_time = element.text();
    element.empty().addClass('edit-active').append('<input type="text" maxlength="2" value="' + current_time + '" onkeypress=\'return event.charCode >= 48 && event.charCode <= 57\'>');
    element.find('input[type="text"]').focus(); //Focus just added field

    //When field is no longer focused
    element.find('input[type="text"]').on('focusout keypress', function(e){
      if(e.type === 'keypress' && e.which != 13){ //If keypress, only continues func on enter press
        return;
      }
      var new_value = $(this).val().replace(/-/, ''); //Gets value and removes - char to prevent negative 0
      var column = $(this).closest('div.column').attr('class').split(' '); //Get column class and hours or minutes
      column.splice(column.indexOf("column"), 1); //Remove shared "column" class from array

      //Validate number, if not empty and within range
      if(new_value && new_value >= validation.time[column].min && new_value <= validation.time[column].max){
        //Update saved value
        selected.time[column] = parseInt(new_value);
      } //else revert to previously stored number

      $(this).parent('div.time').removeClass('edit-active').append(outputTimeString()[column]);
      $(this).remove(); //Removes text input
      updateButtonText(element);
    });
  }

  //Updates the hidden inputs in div.outputs for passing through form
  function updateOutputs(element){
    var outputs = element.closest('div.DateTimePicker').children('div.outputs');
    outputs.empty();

    if(selected.dates.length > 0){
      outputs.append('<input type="hidden" id="' + default_options.inputName + '-count" value="' + selected.dates.length + '">'); //Num of dates to pass to server

      for(var i=0; i<selected.dates.length; i++){
        var formatted_date = selected.dates[i].getFullYear() + "-" + (selected.dates[i].getMonth()+1) + "-" + selected.dates[i].getDate();
        outputs.append('<input type="hidden" id="' + default_options.inputName + '-date-' + i + '" value="' + formatted_date + '">')
      }

      var time = outputTimeString();
      outputs.append('<input type="hidden" id="' + default_options.inputName + '-time" value="' + time.hours + ':' + time.minutes + '">');
    }
  }

  //Used to update the text of the button to open the picker
  function updateButtonText(element){
    var button = element.closest('div.DateTimePicker').children('div.button');
    var num_selected = selected.dates.length;
    var new_text = default_options.buttonText; //Default to reverting back to default text
    var time_string = outputTimeString();

    if(num_selected == 1){ //Shows full date text on button if singular selection
      new_text = selected.dates[0].getDate() + ' ' + system_options.lang[default_options.lang].month[selected.dates[0].getMonth()] + ' ' + selected.dates[0].getFullYear() + ' @ ' + time_string.hours + ':' + time_string.minutes;
    }else if(num_selected > 1){
      new_text = num_selected + ' Dates Selected';
    }

    button.html(new_text);

    //Check button height and adjust picker 'top' attr as appropriate (height + 10px)
    var button_height = button.outerHeight();
    element.closest('div.DateTimePicker').children('div.picker').css('top', button.height() + 20);
  }

})(jQuery);
