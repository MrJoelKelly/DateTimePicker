(function($){
  var system_options = {
    lang: {
      en: { //English
        dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        dayOfWeekShort: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        months: ["January","February","March","April","May","June","July","August","September","October","November","December"]
      },
      de: { //Deutsch
        dayOfWeek: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
        dayOfWeekShort: ["Mo","Di","Mi","Do","Fr","Sa","So"],
        months: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
      }
    }
  }

  //Holds our default options, will be updated based on user-set options
  var default_options = {
    lang: 'en'
  }

  $.fn.dateTimePicker = function(options){
    setOptions(options);

    monthSpinner();
  };

  //Takes user defined options and updates the default options where appropriate
  //Ignores any invalid options
  function setOptions(options){
    //Iterate through keys given in users options
    for(var key in options){
      //If exists in default_options
      if(key in default_options){
        //If a valid option from system_options
        if(options[key] in system_options[key]){
          default_options[key] = options[key]; //Update default_options values
        }
      }
    }
  }

  function monthSpinner(){

    date = getCurrentDate();
    console.log(date);
  }

  function getCurrentDate(){
    var today = new Date();

    return {
      "date":today.getDate(),
      "dayOfWeek":system_options.lang[default_options.lang].dayOfWeek[today.getDay()],
      "dayOfWeekShort":system_options.lang[default_options.lang].dayOfWeekShort[today.getDay()]
    }
  };
})(jQuery);
