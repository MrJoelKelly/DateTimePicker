$(document).ready(function(){

  $('article.design div.DateTimePicker div.button-calendar').click(function(){
    $('article.design article.time').stop().slideUp(200);
    $('article.design article.calendar').stop().slideDown(200);
  })
  $('article.design div.DateTimePicker div.button-time').click(function(){
    $('article.design article.calendar').stop().slideUp(200);
    $('article.design article.time').stop().slideDown(200);
  })

  $('article.functional > div').dateTimePicker({defaultTime: '14:00', buttonText: 'Start Date', startDay: 0, multiple:true});
})
