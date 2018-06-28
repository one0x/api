function fixedHeader(){
    if ($(window).scrollTop() >= 650) {
        $('header .navbar').addClass('fixed-header');
     }
     else {
        $('header .navbar').removeClass('fixed-header');
     }
}

$(window).scroll(function(){
    fixedHeader();
});

$(document).ready(function(){

    fixedHeader();

    $('#share-knowledge, #meet-peers').owlCarousel({
        loop:true,
        margin:0,
        responsiveClass:true,
        dots:true,
        animateIn:'fadeIn',
        animateOut:'fadeOut',
        navText:['<i class="fas fa-angle-left"></i>', '<i class="fas fa-angle-right"></i>'],
        responsive:{
            0:{
                items:1,
                nav:true
            },
            600:{
                items:1,
                nav:false
            },
            1000:{
                items:1,
                nav:true,
                loop:false
            }
        }
    })

    $('.show-more').on('click', function(){
        var showText = $(this).find('span').text();
        if(showText == 'Show more'){
            $(this).find('span').text('Show less')
            $('.home-faq .faq-remaining').removeClass('opacity-zero');
            $(this).find('.fas').removeClass('fa-chevron-down').addClass('fa-chevron-up');
        }
        else{
            $(this).find('span').text('Show more')
            $('.home-faq .faq-remaining').addClass('opacity-zero');
            $(this).find('.fas').removeClass('fa-chevron-up').addClass('fa-chevron-down');
        }
       
    })
    $('.animateBg').css({backgroundSize: '100%'});
    $('.animateBg').hover(function(){
        $(this).stop().animate({backgroundSize: '102%'}, 200);
    },
    function(){
        $(this).stop().animate({backgroundSize: '100%'}, 200);
    });


});