TweenLite.defaultEase = Linear.easeNone;
var tl = new TimelineLite()

tl.to(".box b", 4.05, {x:1000, repeat:-1, yoyo:true})
  .to(".box b", 8.4, {y:720, repeat:-1, yoyo:true}, 0)