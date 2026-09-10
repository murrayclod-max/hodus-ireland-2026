import type { CourseGuide } from './types';

// No Joe call for this one. Hole notes are drawn from the Fried Egg, National
// Club Golfer, Today's Golfer, Evalu18, Mackenzie & Ebert and the club's own
// card — all tagged GUIDE. If Joe weighs in, his lines slot in as JOE sections.

export const annesleyGuide: CourseGuide = {
  slug: 'annesley',
  name: 'Annesley Links',
  nameLines: ['The', 'Annesley'],
  subtitle: 'Royal County Down · Newcastle, Co. Down',
  tees: 'White tees',
  par: 67,
  yards: 4594,
  architects: 'George Combe · Donald Steel · Mackenzie & Ebert 2015',
  strapline: 'The Amuse Bouche · Sunday 13 September · notes from the published reviews, not from Joe',
  cover: '/medallions/rcd.png',
  photos: false,            // flips to true once the aerials are in
  scale: true,              // yardage scale down the left of each aerial
  groupsRound: 0,           // print the tee-time groups, not a match sheet
  rulesTitle: 'Annesley Rules',
  rulesIntro: 'The same dunes as the Championship, a third shorter and half as wide. Read once, then go and enjoy it.',
  rules: [
    {
      title: 'Leave the driver in the locker.',
      body: 'Thirteen par 4s and only one of them reaches 400. On most of them a hybrid or iron leaves a wedge; the driver leaves you in the native grass. The 2nd and the 16th are the only holes where the big club earns its place.',
    },
    {
      title: 'The fairways are 25 to 30 yards wide.',
      body: "Miss either side and it's native grass, not rough — a lost ball, not a bad lie. Position beats distance on every tee. Give yourself a buffer from whichever side is worse.",
    },
    {
      title: 'Small greens, sloping, with run-offs.',
      body: 'Distance control is the whole game here. The greens are perched and tilted, and short or long rolls off. Fly it to the middle, take your two putts, walk.',
    },
    {
      title: 'Fewer clubs, more shots.',
      body: 'The Fried Egg played it with four clubs and a putter and had the round of the trip. Half sets are welcome; creativity is the point. It is the warm-up, so warm up.',
    },
    {
      title: 'A few blind shots, not many.',
      body: 'Far fewer than next door, but the dunes hide a green or two. Get the line from the marker or your playing partners and commit to it.',
    },
    {
      title: 'Stop at 9, 10 and 11.',
      body: "The 2015 holes circle the biggest dune on the property. The 9th tee looks back across the Championship links to the Slieve Donard spires and the Mournes; the 10th runs closer to the beach than any of the 36 holes. Take the photo.",
    },
    {
      title: "It doesn't count.",
      body: 'Nothing here touches the match. Play it for the fun of it, sort out your caddie small talk, and find out how the ball is running in the dunes before it matters on Monday.',
    },
  ],
  holes: [
    {
      n: 1, par: 4, yards: 282, si: 11, tags: ['IRON / HYBRID', 'OPENER'], source: 'guide',
      offTheTee: 'Iron or hybrid, center. Full wedge in.',
      sections: [
        { label: 'TEE', text: 'Iron or hybrid. At 282 there is nothing driver can do for you except find the native grass. Leave yourself a full wedge from the fairway.' },
        { label: 'LINE', text: 'Center of the fairway.' },
        { label: 'IN', text: 'Middle of the green, whatever the flag. The greens here are small and tilted; the middle is the only safe place.' },
        { label: 'NOTE', text: 'The first of thirteen par 4s under 400 yards. Get the opening tee shot in play and the round settles down.' },
      ],
    },
    {
      n: 2, par: 4, yards: 400, si: 5, tags: ['DRIVER', 'LONGEST'], source: 'guide',
      offTheTee: 'Driver, center. The long one.',
      sections: [
        { label: 'TEE', text: 'The one hole where the driver comes out. 400 yards, the longest on the course by fifty and the only one past the 350 mark.' },
        { label: 'LINE', text: 'Center. Same fairway width as everywhere else, so the distance has to come with accuracy.' },
        { label: 'IN', text: 'A mid-iron to a small target. Enough club to carry to the middle; short and it feeds back off the front.' },
        { label: 'NOTE', text: 'Stroke index 5. A par here is a shot gained on the field.' },
      ],
    },
    {
      n: 3, par: 3, yards: 129, si: 9, tags: ['PRECISION'], source: 'guide',
      offTheTee: 'Wedge or short iron. Middle.',
      sections: [
        { label: 'CLUB', text: '129 yards, a wedge or a short iron. The first of the five par 3s.' },
        { label: 'LINE', text: 'Middle of the green.' },
        { label: 'WATCH', text: 'Here the course turns in toward the big dunes. Slopes and run-offs surround a small green; anything that misses the surface keeps going.' },
        { label: 'NOTE', text: 'Stroke index 9 for a 129-yard hole tells you what the green is like.' },
      ],
    },
    {
      n: 4, par: 4, yards: 267, si: 17, tags: ['POSITION', 'PERCHED GREEN'], source: 'guide',
      offTheTee: 'Iron to the flat, then a wedge.',
      sections: [
        { label: 'TEE', text: 'An iron. The fairway has the most movement on the course and accuracy off the tee is what opens up the angle into the green.' },
        { label: 'LINE', text: 'Ask what the fairway is doing before you pick a spot; a flat lie is worth more than ten extra yards.' },
        { label: 'IN', text: 'The green is perched on a dune. Precise distance control keeps the ball on top of it; short falls away, long is gone.' },
        { label: 'NOTE', text: 'Stroke index 17, but the Fried Egg singles it out for the fairway and the green. Easy on the card, not in the air.' },
      ],
    },
    {
      n: 5, par: 4, yards: 272, si: 7, tags: ['IRON / HYBRID'], source: 'guide',
      offTheTee: 'Hybrid or iron, center.',
      sections: [
        { label: 'TEE', text: 'Hybrid or long iron. From here to the 15th the Annesley threads the corridors between the Championship holes 11 through 17, so you are in the same dunes as tomorrow.' },
        { label: 'LINE', text: 'Center.' },
        { label: 'IN', text: 'Short pitch. Middle of the green.' },
        { label: 'NOTE', text: 'Stroke index 7 on a 272-yard hole. The rating is about the green and the grass, not the length.' },
      ],
    },
    {
      n: 6, par: 4, yards: 338, si: 1, tags: ['HYBRID', 'NO BUNKERS', 'SI 1'], source: 'guide',
      offTheTee: 'Hybrid or 3W, center. Position, not length.',
      sections: [
        { label: 'TEE', text: 'A narrow, short par 4 that gently doglegs around a dune ridge into which the green is nestled. The fairway is 25 yards wide and has tumultuous contours, which is why it needs no bunkers.' },
        { label: 'LINE', text: 'Center of the fairway and nothing else. Miss left or right and the ball is lost in native grass, not found in rough.' },
        { label: 'IN', text: 'The green is small and perfectly situated up in the dunes, with a steep falloff on the left. Middle of the green, favor the right half.' },
        { label: 'NOTE', text: "Stroke index 1 and the Fried Egg's favorite hole on the course. Par is a genuine win." },
      ],
    },
    {
      n: 7, par: 3, yards: 124, si: 15, tags: ['WEDGE'], source: 'guide',
      offTheTee: 'Wedge. Middle of the green.',
      sections: [
        { label: 'CLUB', text: '124 yards, a wedge. The second shortest hole on the card.' },
        { label: 'LINE', text: 'Middle of the green.' },
        { label: 'WATCH', text: 'A short hole with a small green is a par or a bogey and rarely anything else. Take the middle and the two putts.' },
        { label: 'NOTE', text: 'Stroke index 15.' },
      ],
    },
    {
      n: 8, par: 4, yards: 264, si: 13, tags: ['RIDGE', 'RIGHT SIDE', 'PHOTO'], source: 'guide',
      offTheTee: 'Iron to the right-hand ledge.',
      sections: [
        { label: 'TEE', text: 'The hole plays along a ridgeline that falls off on either side of the fairway. An iron that stays on top is everything.' },
        { label: 'LINE', text: 'There is a pronounced ledge on the right side of the fairway that gives the best angle into the green. Aim for it.' },
        { label: 'IN', text: 'Short pitch from the ledge. Middle of the green.' },
        { label: 'NOTE', text: 'The view beyond the 8th green is one of the best on the course, dunes to the horizon.' },
      ],
    },
    {
      n: 9, par: 4, yards: 294, si: 3, tags: ['NEW 2015', 'PHOTO', 'SI 3'], source: 'guide',
      offTheTee: 'Hybrid, center. Look first.',
      sections: [
        { label: 'TEE', text: 'The first of the three Mackenzie & Ebert holes routed around the largest dune on the property. Stand on the tee before you hit: from height it looks back across the Championship links to Newcastle, the Slieve Donard spires and the Mournes behind.' },
        { label: 'LINE', text: 'Center. The new holes are bolder than the old ones, with more shaped ground; trust the middle.' },
        { label: 'IN', text: 'Middle of the green.' },
        { label: 'NOTE', text: 'Stroke index 3.' },
      ],
    },
    {
      n: 10, par: 4, yards: 328, si: 6, tags: ['NEW 2015', 'ELEVATED TEE', 'BEACH'], source: 'guide',
      offTheTee: 'Hybrid or 3W from the high tee.',
      sections: [
        { label: 'TEE', text: 'An elevated tee shot on the hole that runs closer to the beach than any of the 36 at Royal County Down. Wind off the sea is the whole calculation.' },
        { label: 'LINE', text: 'Center. Let the elevation do the work; take less club than the number.' },
        { label: 'IN', text: 'Middle of the green.' },
        { label: 'NOTE', text: 'The second of the 2015 holes and the one everyone photographs.' },
      ],
    },
    {
      n: 11, par: 3, yards: 113, si: 18, tags: ['WEDGE', 'SHORTEST'], source: 'guide',
      offTheTee: 'Wedge. Middle.',
      sections: [
        { label: 'CLUB', text: '113 yards, the shortest hole on the course and the last of the three new ones, tucked against the big dune.' },
        { label: 'LINE', text: 'Middle of the green.' },
        { label: 'WATCH', text: 'Stroke index 18. Short and easy on paper; the dune and the wind decide what club it really is.' },
      ],
    },
    {
      n: 12, par: 4, yards: 307, si: 4, tags: ['HYBRID'], source: 'guide',
      offTheTee: 'Hybrid, center.',
      sections: [
        { label: 'TEE', text: 'Hybrid. Back into the corridors between the Championship holes.' },
        { label: 'LINE', text: 'Center. Stroke index 4, so the fairway is doing something; give yourself a buffer.' },
        { label: 'IN', text: 'Middle of the green, enough club to carry the front.' },
      ],
    },
    {
      n: 13, par: 3, yards: 138, si: 8, tags: ['SHORT IRON'], source: 'guide',
      offTheTee: 'Short iron. Middle.',
      sections: [
        { label: 'CLUB', text: '138 yards. The first of back-to-back par 3s.' },
        { label: 'LINE', text: 'Middle of the green.' },
        { label: 'NOTE', text: 'Stroke index 8 on a 138-yard hole. Respect the green.' },
      ],
    },
    {
      n: 14, par: 3, yards: 140, si: 14, tags: ['SHORT IRON'], source: 'guide',
      offTheTee: 'Short iron. Middle.',
      sections: [
        { label: 'CLUB', text: '140 yards, the second of the pair. Two short holes in a row, two different greens.' },
        { label: 'LINE', text: 'Middle of the green.' },
        { label: 'NOTE', text: 'Stroke index 14.' },
      ],
    },
    {
      n: 15, par: 4, yards: 277, si: 10, tags: ['IRON / HYBRID'], source: 'guide',
      offTheTee: 'Iron or hybrid, center.',
      sections: [
        { label: 'TEE', text: 'Iron or hybrid. The last of the holes threaded through the Championship corridors.' },
        { label: 'LINE', text: 'Center.' },
        { label: 'IN', text: 'Wedge. Middle of the green.' },
      ],
    },
    {
      n: 16, par: 4, yards: 349, si: 2, tags: ['3W / DRIVER', 'SI 2'], source: 'guide',
      offTheTee: '3W or driver, center.',
      sections: [
        { label: 'TEE', text: 'The second longest hole and stroke index 2. A 3-wood or a careful driver; this and the 2nd are the only tee shots that want length.' },
        { label: 'LINE', text: 'Center of the fairway.' },
        { label: 'IN', text: 'Mid-iron. Middle of the green, enough club to reach it.' },
        { label: 'NOTE', text: 'Par here and on the 6th wins the day.' },
      ],
    },
    {
      n: 17, par: 4, yards: 258, si: 16, tags: ['DRIVABLE?', 'SCORING'], source: 'guide',
      offTheTee: 'Iron to a wedge, or have a go.',
      sections: [
        { label: 'TEE', text: '258 yards. Drivable for the longer hitters if the wind helps, but the fairway is no wider here than anywhere else and the miss is native grass. The sensible play is an iron and a wedge.' },
        { label: 'LINE', text: 'Center.' },
        { label: 'IN', text: 'Middle of the green.' },
        { label: 'NOTE', text: 'Stroke index 16 and the best scoring chance on the back nine.' },
      ],
    },
    {
      n: 18, par: 4, yards: 314, si: 12, tags: ['3W / IRON', 'BIRDIE CHANCE'], source: 'guide',
      offTheTee: 'Fairway wood or long iron, then a short one.',
      sections: [
        { label: 'TEE', text: 'A fairway wood or long iron, then a short shot in. National Club Golfer calls it the easiest hole on the card and a birdie chance to finish.' },
        { label: 'LINE', text: 'Center.' },
        { label: 'IN', text: 'Middle of the green.' },
        { label: 'NOTE', text: 'Back to the clubhouse with the Championship 18th alongside. Same walk tomorrow, with the driver.' },
      ],
    },
  ],
  quickLook: [
    { title: 'Leave the driver in the bag: everywhere but 2 and 16', body: 'Thirteen par 4s, one of them 400, the rest between 258 and 349 on 25-yard fairways. Hybrid and wedge is the day.' },
    { title: 'Hardest by index: 6, 16, 9, 12', body: 'The 6th is the pick of the course and stroke index 1: 25 yards wide, no bunkers, native grass both sides, small green with a steep falloff left.' },
    { title: 'Scoring chances: 17, 18, 4, 1', body: 'Short par 4s where an iron and a wedge is a birdie look. 17 is drivable in a helping wind; 18 is the easiest on the card.' },
    { title: 'Par 3s: 3, 7, 11, 13, 14', body: 'Between 113 and 140 yards, every one a wedge or short iron to a small tilted green. Middle, two putts, walk.' },
    { title: 'The new holes: 9, 10, 11', body: 'The 2015 loop around the big dune. Bolder ground than the rest, the best views on the property, and the 10th runs along the beach.' },
    { title: 'Photos: 9 tee, 10, 8 green', body: 'From the 9th tee back across the Championship to the Slieve Donard spires and the Mournes. The 10th tee by the sea. The dunes beyond the 8th green.' },
    { title: 'Greens', body: 'Small, perched and sloping, with run-offs all round. Distance control is the whole examination; fly it to the middle.' },
  ],
  closing: ['Leave the driver in the locker.', 'Middle of the green.', 'Look up.'],
  closingSub: "Four and a half thousand yards of the same dunes. It doesn't count, so play it like it does.",
};
