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
      default: '',
      blue: 'DTPBlue'
    },
  };

  //Holds our default options, will be updated based on user-set options
  var default_options = {
    lang: "en",
    style: "default",
    defaultTime: "12:00",
    defaultMonth: "",
    defaultYear: "",
    buttonText: "Select Date",
    startDay: "0" //Day of the week to begin the weeks on
  };

  var today = getCurrentDate();
  var element;

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
  };

  //Sets some default_options that need processing first
  function initiateOptions(){
    default_options.defaultMonth = today.monthNum;
    default_options.defaultYear = today.year;
    console.log(default_options)
  };

  //Takes user defined options and updates the default options where appropriate
  //Ignores any invalid options
  function setOptions(options){
    //Iterate through keys given in users options
    for(var key in options){
      //If exists in default_options, these are user-definable options
      if(key in default_options){
        //If the key exists in system_options, we need to check that the parameter passed is also valid
        if(key in system_options){
          //If a valid option from system_options
          if(!(options[key] in system_options[key])) continue //Skips rest of loop if the key doesn't have a valid value within system_options
        }
        default_options[key] = options[key]; //Update default_options values
      }
    }
  };

  function createPicker(){
    //Default layout elements
    var layout = {
      button: '<div class="button">' + default_options.buttonText + '</div>', //Button to open picker
      picker: '<div class="picker"></div>',
      loader: '<div class="loader"></div>',
      calendar_button: '<div class="button-calendar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 20h-4v-4h4v4zm-6-10h-4v4h4v-4zm6 0h-4v4h4v-4zm-12 6h-4v4h4v-4zm6 0h-4v4h4v-4zm-6-6h-4v4h4v-4zm16-8v22h-24v-22h3v1c0 1.103.897 2 2 2s2-.897 2-2v-1h10v1c0 1.103.897 2 2 2s2-.897 2-2v-1h3zm-2 6h-20v14h20v-14zm-2-7c0-.552-.447-1-1-1s-1 .448-1 1v2c0 .552.447 1 1 1s1-.448 1-1v-2zm-14 2c0 .552-.447 1-1 1s-1-.448-1-1v-2c0-.552.447-1 1-1s1 .448 1 1v2z"/></svg></div>',
      calendar: '<article class="calendar"></article>',
      calendarMonthSpinner: '<div class="month-spinner"><div class="month-previous arrow-left"></div><div class="month-text"></div><div class="month-next arrow-right"></div></div>',
      calendarMonth: '<div class="month"></div>',
      calendarWeek: '<div class="week"><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div><div class="day"></div></div>',
      calendarDay: '<div class="day"></div>'
    }
    //Initiate element. Remove all existing classes and empty content
    element.empty().removeClass().addClass('DateTimePicker');

    element.append(layout.button);
    element.append(layout.picker);
    var picker = element.children('div.picker');
    picker.append(layout.loader); //Loading spinner

    //Bind button to show picker
    $('div.DateTimePicker > div.button').click(function(){
      $(this).siblings('div.picker').stop().fadeToggle(200);
    })

    //Add calendar
    picker.append(layout.calendar_button).append(layout.calendar);
    var calendar = picker.children('article.calendar');
    calendar.append(layout.calendarMonthSpinner);
    calendar.find('div.month-text').text(system_options.lang[default_options.lang].month[default_options.defaultMonth] + ' ' + default_options.defaultYear); //Set initial spinner month and year based on set options
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
  };

  function generateCalendar(month,year,element){
    weeks = element.find('article.calendar div.week').not('.header');
    weeks.children('.day').empty(); //Empty all existing day entries

    var first_day = new Date(year, month, 1).getDay(); //First weekday of selected month
    var last_date = new Date(year, month+1, 0).getDate(); //Last DATE of selected month
    var last_date_previous = new Date(year, month, 0).getDate() - first_day + 1; //Last DATE of the previous month
    var current_day = 1 - first_day; //Set to first day of current month for continuation
    var next_date = 1; //Used for numbering first days of next month in calendar

    //Loop through 6 rows of dates
    for(var i=0; i<6; i++){
      for(var j=0; j<7; j++){
        if((current_day > last_date) && i==5 && j>0){ //If we're on the last row, but past the first cell and on the next month
          weeks.eq(i).children('div.day').eq(j).text(next_date).addClass('next-month');
          next_date++;
        }else if((current_day > last_date) && i==5 && j==0){ //If we reach the first element of the last row and we're on the next month, remove the last row.
          weeks.eq(i).remove();
        }else if((i==0 && j >= first_day) || (i > 0 && current_day <= last_date)){ // If we're past the first weekday of the first of the month or within the date range
          weeks.eq(i).children('div.day').eq(j).text(current_day);
        }else{ //Previous month dates
          weeks.eq(i).children('div.day').eq(j).text(last_date_previous).addClass('prev-month');
          last_date_previous++;
        }
        //Test if current day is today
        if(current_day == today.date && month == today.monthNum && year == today.year){
          weeks.eq(i).children('div.day').eq(j).addClass('today');
        }

        current_day++; //Always increment, starts at 1 minus the weekday number the month starts on
      }
    }
  }

})(jQuery);
