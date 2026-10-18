/* Five original Lienzo landscapes. SVG geometry, gradients, and CSS motion only. */
(() => {
  'use strict';

  const VIOLET = '#8b7bff', DEEP = '#6e5df2', MINT = '#35d6c8', AMBER = '#ffb454';
  const WHITE = '#fff', BLACK = '#111', INK = '#242424';
  let serial = 0;
  const p = (d, fill, attrs = '') => `<path d="${d}" fill="${fill}" ${attrs}/>`;
  const r = (x, y, w, h, fill, attrs = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${attrs}/>`;
  const c = (x, y, radius, fill, attrs = '') => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" ${attrs}/>`;
  const e = (x, y, rx, ry, fill, attrs = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${attrs}/>`;
  const g = (name, body, attrs = '') => `<g class="${name}" ${attrs}>${body}</g>`;
  const stroke = (d, color, width = 1, attrs = '') => p(d, 'none', `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${attrs}`);
  const stops = rows => rows.map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('');
  const linear = (id, rows, attrs = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1" ${attrs}>${stops(rows)}</linearGradient>`;
  const radial = (id, rows, attrs = '') => `<radialGradient id="${id}" ${attrs}>${stops(rows)}</radialGradient>`;
  const clip = (id, body) => `<clipPath id="${id}">${body}</clipPath>`;

  function pine(x, base, height, fill, variant = 0) {
    const w = height * .31;
    return g('eg-art-pine', p(`M${x} ${base-height}L${x+w*.35} ${base-height*.78}L${x+w*.18} ${base-height*.79}L${x+w*.65} ${base-height*.52}L${x+w*.4} ${base-height*.55}L${x+w} ${base-height*.16}L${x+w*.5} ${base-height*.24}L${x+w*.63} ${base-height*.08}L${x-w*.66} ${base-height*.08}L${x-w*.48} ${base-height*.24}L${x-w*.95} ${base-height*.16}L${x-w*.38} ${base-height*.55}L${x-w*.63} ${base-height*.52}L${x-w*.18} ${base-height*.79}L${x-w*.34} ${base-height*.78}Z`, fill) + p(`M${x-2.2} ${base-height*.29}L${x+2} ${base-height*.29}L${x+3.2} ${base+7}L${x-3.6} ${base+7}Z`, fill), variant ? `opacity="${variant}"` : '');
  }

  function rock(x, y, size, main, light, shadow) {
    return g('eg-art-rock', p(`M${x-size*.58} ${y+size*.2}L${x-size*.37} ${y-size*.31}L${x+size*.12} ${y-size*.48}L${x+size*.57} ${y-size*.15}L${x+size*.65} ${y+size*.25}L${x+size*.15} ${y+size*.43}Z`, main) + p(`M${x-size*.58} ${y+size*.2}L${x-size*.37} ${y-size*.31}L${x+size*.12} ${y-size*.48}L${x+size*.03} ${y+size*.06}Z`, light) + p(`M${x+size*.03} ${y+size*.06}L${x+size*.57} ${y-size*.15}L${x+size*.65} ${y+size*.25}L${x+size*.15} ${y+size*.43}Z`, shadow));
  }

  function grass(x, y, scale, color) {
    return g('eg-art-grass', stroke(`M${x} ${y}Q${x-4*scale} ${y-24*scale} ${x-20*scale} ${y-39*scale}M${x+2*scale} ${y}Q${x+5*scale} ${y-35*scale} ${x+14*scale} ${y-51*scale}M${x-2*scale} ${y}Q${x-17*scale} ${y-19*scale} ${x-34*scale} ${y-20*scale}M${x+3*scale} ${y}Q${x+20*scale} ${y-25*scale} ${x+35*scale} ${y-28*scale}M${x} ${y}Q${x-1*scale} ${y-30*scale} ${x-6*scale} ${y-58*scale}`, color, 2.2*scale));
  }

  function valley(id) {
    const url = name => `url(#${id(name)})`;
    const accent = 'var(--eg-accent,#8b7bff)';
    const left = 'M-100 500L65 440L142 350L240 430L317 325L404 448L485 500L548 630L462 810L329 1020H-100Z';
    const right = 'M1300 398L1157 320L1085 386L1000 285L901 395L821 366L748 481L703 640L762 812L911 1040H1300Z';
    const defs = linear(id('sky'), [['0', DEEP], ['.48', accent], ['1', WHITE]]) + radial(id('sun-halo'), [['0', WHITE, .76], ['.32', WHITE, .23], ['1', WHITE, 0]]) + linear(id('far'), [['0', WHITE, .26], ['.42', accent, .88], ['1', DEEP]]) + linear(id('left'), [['0', accent], ['.54', DEEP], ['1', BLACK]]) + linear(id('right'), [['0', accent], ['.6', DEEP], ['1', BLACK]], 'gradientTransform="rotate(28 .5 .5)"') + linear(id('river'), [['0', WHITE, .32], ['.22', MINT, .88], ['.67', accent], ['1', MINT]]) + radial(id('ray'), [['0', WHITE, .09], ['.5', WHITE, .025], ['1', WHITE, 0]], 'cx=".6" cy=".2" r=".75"') + linear(id('bank'), [['0', DEEP], ['1', BLACK]]) + clip(id('left-clip'), p(left, WHITE)) + clip(id('right-clip'), p(right, WHITE));
    const back = r(-90, -90, 1380, 1180, url('sky')) + c(735, 210, 280, url('sun-halo')) + c(735, 210, 49, WHITE, 'opacity=".6"') + p('M-80 515L50 469L124 418L176 421L239 362L282 383L338 336L374 342L434 398L477 413L532 395L585 439L629 470L680 432L738 418L802 368L847 383L900 332L949 355L998 321L1042 330L1109 395L1162 374L1228 397L1300 353V850H-80Z', url('far'), 'opacity=".66"') + p('M-90 572L36 466L150 497L246 416L371 500L486 423L588 521L665 439L789 489L880 410L1005 491L1137 416L1290 477V800H-90Z', DEEP, 'opacity=".24"') + g('eg-art-valley-cloud', p('M284 269C430 235 589 242 719 266C793 280 854 280 935 267C782 304 608 291 510 283C420 276 347 279 284 269Z', WHITE, 'opacity=".12"')) + r(-90, -90, 1380, 1180, url('ray'));
    const leftDetails = g('eg-art-valley-strata', [
      stroke('M-60 604L112 523L198 556L270 489L330 518L402 472L476 548', WHITE, 2, 'opacity=".16"'),
      stroke('M-42 665L122 575L203 613L297 555L390 580L496 618', accent, 3, 'opacity=".7"'),
      stroke('M-18 744L100 655L167 675L237 623L309 655L386 633L487 690', WHITE, 1.8, 'opacity=".12"'),
      stroke('M55 809L135 723L203 751L272 705L333 735L411 706', BLACK, 5, 'opacity=".16"'),
      stroke('M143 350L165 466L200 534L211 657L263 730L248 837', WHITE, 2, 'opacity=".12"'),
      stroke('M317 325L300 436L337 503L319 613L350 683', BLACK, 3, 'opacity=".19"'),
      p('M142 350L181 415L209 477L199 482L157 433Z', WHITE, 'opacity=".21"'),
      p('M317 325L354 392L386 426L346 407Z', WHITE, 'opacity=".28"'),
      p('M68 442L115 473L94 550L43 568Z', accent, 'opacity=".42"'),
    ].join(''), `clip-path="${url('left-clip')}"`);
    const rightDetails = g('eg-art-valley-strata', stroke('M802 447L853 480L899 449L966 480L1021 427L1091 470L1195 427L1267 466', WHITE, 2, 'opacity=".24"') + stroke('M748 547L842 524L904 569L982 529L1067 569L1161 511L1290 552', BLACK, 4, 'opacity=".13"') + stroke('M729 642L816 604L903 641L1000 603L1093 637L1199 588L1280 630', WHITE, 2, 'opacity=".12"') + stroke('M761 755L873 690L969 734L1073 675L1187 722L1266 679', accent, 3, 'opacity=".65"') + stroke('M1000 285L987 425L1016 506L993 596L1040 739', WHITE, 2, 'opacity=".16"') + stroke('M901 395L899 484L928 535L912 610', BLACK, 2, 'opacity=".22"') + p('M1000 285L1015 348L1054 380L1026 375L1004 354L986 378Z', WHITE, 'opacity=".38"') + p('M821 366L845 404L866 425L835 416L819 395L805 412Z', WHITE, 'opacity=".35"'), `clip-path="${url('right-clip')}"`);
    const river = p('M626 480C613 499 632 516 611 550C577 580 660 605 610 644C551 690 664 714 597 761C527 810 605 832 531 890C469 941 457 967 420 1070H814C753 986 662 956 684 908C713 854 628 834 683 781C740 727 643 695 682 653C718 610 647 582 665 550C681 517 634 498 626 480Z', url('river')) + g('eg-art-valley-river', stroke('M626 507C599 526 633 538 621 551M638 585C608 604 642 621 621 641M644 687C614 709 649 722 618 744M615 787C584 814 626 828 588 858M576 915C541 945 557 969 534 1009', WHITE, 4, 'opacity=".54"') + stroke('M631 568C608 578 635 585 644 594M623 662C609 674 625 681 634 689M656 753C640 761 642 773 648 781M618 893C604 903 607 912 613 920', WHITE, 1.5, 'opacity=".8"'));
    const mist = g('eg-art-valley-mist', p('M255 532C388 505 520 540 653 528C794 516 873 509 1000 530C839 547 749 561 615 553C477 545 381 556 255 532Z', WHITE, 'opacity=".17"') + p('M308 658C422 641 495 654 580 660C693 668 787 641 886 652C792 677 692 687 576 679C462 671 396 678 308 658Z', WHITE, 'opacity=".1"'));
    const middle = p(left, url('left')) + leftDetails + p(right, url('right')) + rightDetails + river + pine(474, 615, 67, BLACK, .5) + pine(725, 636, 89, BLACK, .45) + pine(443, 671, 54, BLACK, .5) + mist;
    const front = p('M-90 849L42 809L135 840L223 802L315 865L371 843L462 932L438 1090H-90Z', url('bank')) + p('M1300 784L1198 789L1101 823L1028 804L928 868L866 858L783 976L827 1090H1300Z', url('bank')) + rock(308, 917, 96, DEEP, accent, BLACK) + rock(903, 935, 109, BLACK, DEEP, BLACK) + grass(218, 890, 1.2, BLACK) + grass(1001, 924, 1.5, BLACK) + pine(112, 944, 164, BLACK, .85) + pine(1109, 923, 198, BLACK, .8);
    return { defs, back, middle, front };
  }

  function forest(id) {
    const url = name => `url(#${id(name)})`;
    const accent = 'var(--eg-accent,#35d6c8)';
    const defs = linear(id('sky'), [['0', WHITE], ['.6', accent], ['1', BLACK]]) + radial(id('clearing'), [['0', WHITE, .9], ['.42', WHITE, .28], ['1', WHITE, 0]]) + linear(id('ground'), [['0', accent], ['1', BLACK]]) + linear(id('bark'), [['0', BLACK], ['.4', accent], ['.48', BLACK], ['1', BLACK]], 'gradientTransform="rotate(-90 .5 .5)"') + linear(id('trunk-front'), [['0', BLACK], ['.65', BLACK], ['.78', accent], ['1', BLACK]], 'gradientTransform="rotate(-90 .5 .5)"') + linear(id('path'), [['0', WHITE], ['.45', accent], ['1', BLACK]]) + linear(id('light'), [['0', WHITE, .44], ['1', WHITE, 0]]);
    const farTrees = [
      [27, 660, 461], [117, 611, 378], [205, 601, 421], [295, 619, 342], [376, 582, 298], [449, 585, 331], [526, 598, 280], [690, 599, 301], [764, 605, 350], [847, 610, 408], [937, 625, 372], [1030, 664, 482], [1134, 683, 428], [1231, 688, 511],
    ].map(([x, y, h], i) => pine(x, y, h, i % 2 ? WHITE : accent, .19)).join('');
    const back = r(-90, -90, 1380, 1180, url('sky')) + c(615, 286, 305, url('clearing')) + c(615, 286, 48, WHITE, 'opacity=".64"') + p('M-80 627Q120 497 291 560T650 548T1020 559T1300 530V1100H-80Z', accent, 'opacity=".17"') + farTrees + g('eg-art-forest-light', p('M547 122L607 138L347 935L216 964Z', url('light')) + p('M668 133L709 147L885 991L715 981Z', url('light')) + p('M620 114L647 116L613 856L537 874Z', url('light'), 'opacity=".5"'));
    const tree = (x, base, h, bend, opacity = 1) => {
      const top = base - h, width = h * .047;
      return g('eg-art-forest-trunk', p(`M${x-width} ${base+30}Q${x-width*.8+bend} ${base-h*.46} ${x-width*.25+bend} ${top}L${x+width*.35+bend} ${top}Q${x+width+bend*.4} ${base-h*.42} ${x+width*1.1} ${base+30}Z`, url('bark')) + stroke(`M${x+bend*.1} ${base-21}Q${x+bend} ${base-h*.55} ${x+bend} ${top+31}`, WHITE, 1.5, 'opacity=".14"') + stroke(`M${x} ${base-h*.58}L${x-h*.12} ${base-h*.72}M${x+2} ${base-h*.43}L${x+h*.14} ${base-h*.59}M${x+bend*.5} ${base-h*.8}L${x+h*.1+bend} ${top+h*.13}`, BLACK, Math.max(3, width*.3)), `opacity="${opacity}"`);
    };
    const trunks = tree(226, 802, 773, -12, .55) + tree(363, 751, 639, 11, .43) + tree(461, 700, 455, -16, .38) + tree(803, 741, 625, 16, .48) + tree(958, 808, 805, -20, .62) + tree(1103, 831, 897, 18, .7);
    const middleGround = p('M-80 708C147 680 265 728 389 719C506 706 566 674 650 673C785 669 896 726 1005 715C1115 704 1225 674 1300 687V1100H-80Z', url('ground')) + p('M602 642C580 684 657 702 637 741C618 775 524 779 524 834C524 888 639 925 618 1060H811C782 959 625 917 625 858C625 806 737 801 729 750C719 697 648 690 654 642Z', url('path'), 'opacity=".77"') + p('M-60 815Q176 740 328 813T594 818Q383 893 225 857T-60 900Z', BLACK, 'opacity=".18"') + p('M746 806Q908 747 1125 826L1300 815V1000Q991 913 746 806Z', accent, 'opacity=".11"');
    const ferns = [];
    for (let i = 0; i < 7; i++) {
      const x = 174 + i * 11, y = 857 - i * 9;
      ferns.push(p(`M${x} ${y}Q${x-31} ${y-29} ${x-59} ${y-20}Q${x-38} ${y+2} ${x} ${y}Z`, accent, `opacity="${.18+i*.04}"`));
      ferns.push(p(`M${x} ${y}Q${x+21} ${y-40} ${x+48} ${y-38}Q${x+36} ${y-4} ${x} ${y}Z`, accent, `opacity="${.18+i*.04}"`));
    }
    const middle = middleGround + trunks + pine(317, 788, 214, BLACK, .37) + pine(865, 785, 225, BLACK, .35) + g('eg-art-forest-fern', ferns.join(''), 'style="transform-origin:214px 860px"') + rock(441, 842, 69, accent, WHITE, BLACK) + rock(850, 831, 74, BLACK, accent, BLACK) + g('eg-art-forest-haze', p('M262 626C420 589 580 632 728 604C844 583 912 607 1026 613C849 637 733 638 592 635C461 633 356 647 262 626Z', WHITE, 'opacity=".1"'));
    const canopy = p('M-90-90H1290V84L1201 132L1138 113L1076 157L1011 128L953 165L899 122L849 145L797 89L727 118L679 75L615 101L554 55L501 92L429 57L388 115L329 90L274 148L209 113L163 162L110 132L48 188L-90 154Z', BLACK, 'opacity=".88"');
    const leftFront = p('M-76-80L73-80L102 140L78 376L114 624L165 1100H-110V-80Z', url('trunk-front')) + p('M52 305L162 183L263 145L271 158L172 207L70 347Z', BLACK) + p('M81 467L182 411L193 421L89 501Z', BLACK) + stroke('M51 65L67 221L50 386L76 590L82 857', WHITE, 3, 'opacity=".09"');
    const rightFront = p('M1130-80H1300V1100H1078L1113 796L1090 562L1123 281Z', url('trunk-front')) + p('M1120 259L1003 178L907 160L903 172L998 200L1110 300Z', BLACK) + p('M1111 579L1009 500L966 496L963 507L1030 539L1108 617Z', BLACK);
    const front = canopy + leftFront + rightFront + p('M-80 986Q106 864 300 954L398 1100H-80Z', BLACK) + p('M865 1100L949 954Q1093 888 1290 938V1100Z', BLACK) + grass(216, 1005, 2.2, BLACK) + grass(1000, 1011, 2.6, BLACK) + g('eg-art-forest-leaves', p('M914 924Q866 875 883 846Q923 863 914 924Z', accent, 'opacity=".3"') + p('M914 924Q942 862 980 865Q976 904 914 924Z', accent, 'opacity=".27"') + p('M930 972Q888 946 890 918Q925 918 930 972Z', accent, 'opacity=".2"'), 'style="transform-origin:922px 966px"');
    return { defs, back, middle, front };
  }

  function dunes(id) {
    const url = name => `url(#${id(name)})`;
    const accent = 'var(--eg-accent,#ffb454)';
    const dune = 'M-100 658C123 548 238 586 415 652C572 709 714 650 834 511C920 409 1050 430 1300 504V1090H-100Z';
    const defs = linear(id('sky'), [['0', WHITE], ['1', accent]]) + radial(id('sunlight'), [['0', WHITE, .88], ['.26', WHITE, .25], ['1', WHITE, 0]]) + linear(id('far-sand'), [['0', accent], ['1', WHITE]]) + linear(id('main-dune'), [['0', WHITE], ['.22', accent], ['1', BLACK]], 'gradientTransform="rotate(-24 .5 .5)"') + linear(id('shade'), [['0', accent], ['1', BLACK]], 'gradientTransform="rotate(38 .5 .5)"') + linear(id('foreground'), [['0', accent], ['.75', BLACK], ['1', BLACK]]) + clip(id('dune-clip'), p(dune, WHITE));
    const back = r(-90, -90, 1380, 1180, url('sky')) + c(747, 227, 255, url('sunlight')) + c(747, 227, 88, accent, 'opacity=".54"') + c(747, 227, 74, WHITE, 'opacity=".42"') + stroke('M747 126V117M847 227H856M747 328V337M646 227H637', WHITE, 2, 'opacity=".44"') + p('M-100 506Q76 374 224 452T492 456T793 431T1095 437T1300 419V1000H-100Z', url('far-sand')) + p('M-100 559C105 435 271 504 391 514C546 528 648 419 802 440C963 460 1030 516 1300 431V1000H-100Z', accent, 'opacity=".32"') + p('M-100 611C87 569 154 485 342 511C466 529 535 621 683 601C862 575 1045 481 1300 546V1000H-100Z', accent, 'opacity=".38"');
    const ridge = p('M553 724C678 666 768 552 834 511C955 437 1112 485 1300 504V882C1137 803 1051 784 931 805C790 829 680 802 553 724Z', url('shade')) + p('M-100 658C117 548 244 587 415 652C523 691 618 693 705 659C614 729 483 762 355 734C192 699 100 678-100 760Z', accent, 'opacity=".44"') + stroke('M-80 652C144 548 252 594 415 652C572 709 714 650 834 511C920 409 1050 430 1280 500', WHITE, 3, 'opacity=".66"') + stroke('M581 728C717 701 778 609 860 572C999 508 1118 551 1284 578', accent, 2, 'opacity=".55"') + stroke('M684 767C782 747 848 690 932 675C1059 651 1178 695 1290 740', WHITE, 1.5, 'opacity=".2"');
    const ripples = [];
    for (let i = 0; i < 15; i++) {
      const y = 751 + i * 15;
      ripples.push(stroke(`M${-100+i*9} ${y}C${110+i*8} ${y-83} ${260+i*8} ${y-13} ${405+i*7} ${y+31}C${555+i*5} ${y+74} ${703+i*8} ${y+42} ${917+i*10} ${y+6}`, i % 3 === 0 ? WHITE : accent, i % 3 === 0 ? 1.5 : 1, `opacity="${i%3===0?.24:.23}"`));
    }
    const wind = g('eg-art-dunes-wind', stroke('M394 597C505 623 615 607 696 569M454 621C539 635 628 622 686 599M891 470C966 450 1041 459 1107 476', WHITE, 2, 'opacity=".35"') + stroke('M137 616Q232 594 318 624M803 526Q846 487 885 480', WHITE, 1, 'opacity=".52"'));
    const middle = p(dune, url('main-dune')) + ridge + g('eg-art-dune-ripples', ripples.join(''), `clip-path="${url('dune-clip')}"`) + wind + rock(1017, 691, 40, accent, WHITE, BLACK) + rock(1050, 703, 20, BLACK, accent, BLACK);
    const front = p('M-100 987C156 793 348 838 529 950C742 1082 939 965 1300 813V1110H-100Z', url('foreground')) + stroke('M-59 973C155 805 349 858 518 961', WHITE, 3, 'opacity=".25"') + grass(1002, 924, 1.1, BLACK) + grass(1017, 938, .65, BLACK) + rock(212, 948, 76, accent, accent, BLACK) + rock(270, 969, 44, BLACK, accent, BLACK) + g('eg-art-dunes-sheen', p('M286 918C379 936 447 996 529 1038C428 1010 358 961 286 918Z', WHITE, 'opacity=".14"'));
    return { defs, back, middle, front };
  }

  function archRing(x, y, width, height, thickness, fill, attrs = '') {
    const radius = width / 2;
    return p(`M${x} ${y+height}V${y+radius}A${radius} ${radius} 0 0 1 ${x+width} ${y+radius}V${y+height}Z M${x+thickness} ${y+height}V${y+radius}A${radius-thickness} ${radius-thickness} 0 0 1 ${x+width-thickness} ${y+radius}V${y+height}Z`, fill, `fill-rule="evenodd" ${attrs}`);
  }

  function architecture(id) {
    const url = name => `url(#${id(name)})`;
    const accent = 'var(--eg-accent,#8b7bff)';
    const defs = linear(id('sky'), [['0', MINT], ['1', WHITE]]) + linear(id('floor'), [['0', WHITE], ['.55', WHITE], ['1', accent]]) + linear(id('stone'), [['0', WHITE], ['.62', WHITE], ['1', accent]], 'gradientTransform="rotate(-20 .5 .5)"') + linear(id('side'), [['0', accent], ['1', WHITE]], 'gradientTransform="rotate(-90 .5 .5)"') + linear(id('column'), [['0', WHITE], ['.73', WHITE], ['1', accent]], 'gradientTransform="rotate(-90 .5 .5)"') + linear(id('tread'), [['0', WHITE], ['1', accent]]) + linear(id('shaft'), [['0', AMBER, .14], ['.35', WHITE, .3], ['1', WHITE, 0]]) + radial(id('ambient'), [['0', MINT, .23], ['1', MINT, 0]]);
    const back = r(-90, -90, 1380, 1180, url('sky')) + r(-90, 501, 1380, 589, url('floor')) + r(466, 374, 269, 180, WHITE) + r(487, 400, 220, 154, accent, 'opacity=".25"') + archRing(512, 325, 175, 232, 22, WHITE) + p('M553 555V414A47 47 0 0 1 647 414V555Z', MINT, 'opacity=".3"') + p('M563 555V414A37 37 0 0 1 637 414V555Z', WHITE, 'opacity=".6"') + r(607, 354, 11, 196, WHITE, 'opacity=".6"') + c(650, 464, 156, url('ambient')) + stroke('M-80 1000L600 501L1290 1000M118 1100L600 501M381 1100L600 501M846 1100L600 501M1147 1100L600 501M-80 903H1290M-80 774H1290M-80 675H1290M-80 603H1290M-80 550H1290', accent, 1, 'opacity=".2"');
    const portalSide = p('M920 403C920 226 777 83 600 83L631 66C808 66 951 210 951 386V754L920 777Z', url('side')) + p('M374 766V405A226 226 0 0 1 826 405V766L802 750V405A202 202 0 0 0 398 405V750Z', accent, 'opacity=".18"');
    const portal = portalSide + archRing(280, 83, 640, 694, 93, url('stone')) + stroke('M299 771V403A301 301 0 0 1 901 403V771', WHITE, 2, 'opacity=".85"') + stroke('M373 777V403A227 227 0 0 1 827 403V777', accent, 1.5, 'opacity=".35"') + archRing(407, 228, 386, 467, 24, WHITE) + p('M793 421V695L811 684V421A211 211 0 0 0 600 210L600 228A193 193 0 0 1 793 421Z', accent, 'opacity=".15"');
    const steps = [];
    const stepRows = [[453, 573, 294, 27], [429, 600, 342, 31], [401, 631, 398, 35], [367, 666, 466, 42], [326, 708, 548, 49], [276, 757, 648, 59], [216, 816, 768, 68]];
    stepRows.forEach(([x, y, w, h], i) => steps.push(r(x, y, w, h, WHITE) + p(`M${x} ${y+h}H${x+w}L${x+w+10} ${y+h+6}H${x-10}Z`, accent, `opacity="${.08+i*.012}"`) + r(x, y+h-2, w, 2, accent, 'opacity=".23"') + r(x+1, y+3, w-2, h-6, url('tread'), `opacity="${.08+i*.02}"`)));
    const wall = p('M-90-90H229V804L183 835H-90Z', WHITE) + p('M229-90H268V779L229 804Z', accent, 'opacity=".16"') + p('M982-90H1290V1090H1037V778L982 753Z', WHITE) + p('M982-90H1013V769L982 753Z', MINT, 'opacity=".16"');
    const middle = wall + portal + steps.join('') + g('eg-art-architecture-light', p('M876-60L1177-60L643 954L339 906Z', url('shaft')) + p('M824 278L867 314L646 844L552 823Z', WHITE, 'opacity=".13"'));
    const column = (x, y, w, h) => r(x-13, y, w+26, 30, WHITE) + p(`M${x+w+13} ${y}L${x+w+33} ${y-12}V${y+18}L${x+w+13} ${y+30}Z`, accent, 'opacity=".2"') + r(x, y+30, w, h-60, url('column')) + r(x-20, y+h-30, w+40, 30, WHITE) + stroke(`M${x+12} ${y+42}V${y+h-43}M${x+31} ${y+42}V${y+h-43}M${x+w-25} ${y+42}V${y+h-43}`, accent, 1, 'opacity=".16"') + p(`M${x-20} ${y+h}L${x+w+20} ${y+h}L${x+w+39} ${y+h+13}L${x-36} ${y+h+13}Z`, BLACK, 'opacity=".07"');
    const front = column(69, 135, 104, 784) + column(1041, 38, 103, 871) + p('M131 920L182 919L457 1100H299Z', accent, 'opacity=".12"') + p('M1086 911L1138 911L1290 1010V1089Z', accent, 'opacity=".16"') + p('M216 884H984L1042 920H160Z', WHITE, 'opacity=".7"') + stroke('M216 884H984', WHITE, 2) + p('M-90 1056H1290V1100H-90Z', WHITE);
    return { defs, back, middle, front };
  }

  function coast(id) {
    const url = name => `url(#${id(name)})`;
    const accent = 'var(--eg-accent,#35d6c8)';
    const cliff = 'M865 337L952 304L1006 325L1088 298L1193 342L1290 326V1060L1122 946L1004 822L942 764L854 720L829 620L862 562L832 456Z';
    const defs = linear(id('sky'), [['0', WHITE], ['1', accent]]) + linear(id('sea'), [['0', accent], ['.44', accent], ['1', BLACK]]) + linear(id('cliff'), [['0', WHITE], ['.32', WHITE], ['1', accent]], 'gradientTransform="rotate(28 .5 .5)"') + linear(id('headland'), [['0', accent], ['1', BLACK]]) + linear(id('beach'), [['0', WHITE], ['.75', AMBER], ['1', BLACK]], 'gradientTransform="rotate(29 .5 .5)"') + linear(id('near-cliff'), [['0', accent], ['1', BLACK]], 'gradientTransform="rotate(25 .5 .5)"') + clip(id('cliff-clip'), p(cliff, WHITE));
    const sea = p('M-90 355H1290V1100H-90Z', url('sea'));
    const back = r(-90, -90, 1380, 1180, url('sky')) + g('eg-art-coast-cloud', p('M238 214C403 189 541 204 668 195C789 187 878 195 974 215C849 209 737 224 620 221C477 218 365 224 238 214Z', WHITE, 'opacity=".25"')) + sea + stroke('M-40 356H1230', WHITE, 1.5, 'opacity=".32"') + p('M-90 360L18 338L91 346L154 323L243 340L317 366L416 378L491 400L518 438L437 432L358 409L288 404L230 387L159 380L95 392L26 375L-90 403Z', accent, 'opacity=".31"') + p('M1300 371L1155 350L1067 367L994 351L918 369L874 400L932 423L1051 413L1129 427L1300 422Z', WHITE, 'opacity=".4"') + stroke('M558 205Q566 197 575 204Q584 196 593 203M615 237Q621 231 628 237Q636 229 643 236', BLACK, 2, 'opacity=".43"');
    const surf = p('M910 624C867 636 863 694 818 727C754 775 714 797 688 856C654 931 604 970 520 1054L1290 1100V1009L1121 904L1015 795L963 749L924 695Z', url('beach')) + p('M899 636C866 670 856 707 817 736C745 787 713 825 687 887C653 963 596 1008 545 1057', 'none', 'stroke="#fff" stroke-width="13" opacity=".57"') + p('M881 630C848 665 847 702 801 732C735 778 697 822 674 879C640 953 587 1007 526 1055', 'none', 'stroke="#fff" stroke-width="4" opacity=".65"');
    const cliffDetails = g('eg-art-coast-strata', stroke('M832 420L904 402L970 425L1036 400L1110 429L1182 406L1280 425', accent, 2, 'opacity=".42"') + stroke('M835 478L912 458L982 479L1071 451L1145 480L1230 456L1292 470', BLACK, 2, 'opacity=".12"') + stroke('M842 539L918 519L998 542L1074 513L1160 546L1280 525', accent, 3, 'opacity=".35"') + stroke('M836 613L903 594L988 615L1068 588L1163 622L1280 600', BLACK, 1.5, 'opacity=".1"') + stroke('M854 684L938 666L1006 689L1111 664L1197 702L1290 678', WHITE, 3, 'opacity=".45"') + stroke('M952 304L932 422L947 488L918 588L943 693L942 764M1088 298L1056 439L1074 512L1047 623L1076 759L1044 858M1193 342L1162 501L1185 596L1162 740L1207 857', accent, 2, 'opacity=".38"') + p('M1010 330L1005 442L977 515L992 587L971 666L990 759L1004 822L1046 862L1046 743L1028 669L1054 588L1032 513L1044 434Z', accent, 'opacity=".21"'), `clip-path="${url('cliff-clip')}"`);
    const left = p('M-100 411L38 378L125 410L200 397L274 460L301 546L355 585L383 661L346 738L266 781L135 806L-100 859Z', url('headland')) + p('M-100 411L38 378L125 410L200 397L274 460L301 494L197 468L115 469L22 438L-100 481Z', accent, 'opacity=".42"') + stroke('M8 513L97 538L184 529L262 566M-35 629L74 614L169 647L294 630M18 743L112 705L203 732L314 691', WHITE, 2, 'opacity=".12"');
    const currents = g('eg-art-coast-current', stroke('M390 473C518 453 624 479 745 455M344 547C467 510 622 549 738 511M402 629C509 597 602 625 707 583M331 700C454 676 530 700 649 664M349 805C439 771 514 795 614 747M402 918C474 878 510 892 554 854', WHITE, 2, 'opacity=".31"') + stroke('M538 409Q626 402 704 412M473 572Q539 553 596 568M454 742Q510 727 552 735', WHITE, 1, 'opacity=".56"'));
    const middle = surf + left + p(cliff, url('cliff')) + cliffDetails + p('M865 337L952 304L1006 325L1088 298L1193 342L1290 326V362L1190 375L1093 335L1004 356L955 341L866 374Z', accent, 'opacity=".4"') + currents + rock(449, 800, 100, BLACK, accent, BLACK) + rock(500, 835, 55, BLACK, accent, BLACK) + e(446, 827, 80, 13, WHITE, 'opacity=".1"') + rock(786, 621, 38, accent, WHITE, BLACK);
    const front = p('M-90 877L37 823L121 863L184 828L246 883L272 965L337 1028V1100H-90Z', url('near-cliff')) + p('M1300 806L1213 838L1182 926L1137 961L1123 1100H1300Z', url('near-cliff')) + rock(983, 940, 91, BLACK, accent, BLACK) + rock(1044, 969, 57, BLACK, WHITE, BLACK) + grass(153, 934, 1.8, BLACK) + g('eg-art-coast-foam', stroke('M341 881C364 846 414 849 437 868M445 870C470 883 509 872 524 854M916 959C939 931 974 929 999 947M998 986C1020 995 1042 989 1061 977', WHITE, 4, 'opacity=".47"') + stroke('M324 888Q336 882 342 876M530 847L536 842M911 967L903 975M1068 974L1074 968', WHITE, 2, 'opacity=".7"'));
    return { defs, back, middle, front };
  }

  const worlds = [valley, forest, dunes, architecture, coast];
  const names = ['valley', 'forest', 'dunes', 'architecture', 'coast'];
  window.LienzoGalleryArt = (index, suffix = '') => {
    const number = Number(index);
    const selected = Number.isInteger(number) && number >= 0 && number < worlds.length ? number : 0;
    const safeSuffix = String(suffix).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40) || 'art';
    const prefix = `egw-${selected}-${safeSuffix}-${++serial}-`;
    const result = worlds[selected](name => prefix + name);
    return `<div class="eg-art-original" data-world="${names[selected]}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000" width="1200" height="1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${result.defs}</defs><g class="eg-depth-back">${result.back}</g><g class="eg-depth-middle">${result.middle}</g><g class="eg-depth-front">${result.front}</g></svg></div>`;
  };
})();

/* Lienzo Landscape Gallery. Local state, independent image settings, and explicit exports. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a || !window.LienzoGalleryArt) return;
  const {state, $, $$, ui, colors} = a;
  const gallery = $('[data-gallery]'), board = $('[data-panels]');
  const focusDialog = $('[data-gallery-focus]'), focusCanvas = $('[data-focus-canvas]'), focusArt = $('[data-focus-art]');
  const editor = $('[data-editor]'), sourceDialog = $('[data-export-dialog]');
  const narrow = matchMedia('(max-width:760px)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  const total = state.items.length, uploads = Array(total).fill(0), loading = Array(total).fill(false);
  const visibility = new WeakMap();
  const clamp = (value, low, high, fallback) => Number.isFinite(Number(value)) ? Math.min(high, Math.max(low, Number(value))) : fallback;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
  const photo = value => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value) ? value : '';
  const effectiveLayout = () => state.layout === 'auto' ? (narrow.matches ? 'vertical' : 'horizontal') : state.layout;
  let hoverTimer = 0, scrollFrame = 0, pointerFrame = 0;
  let pointerHost = null, pointerBox = null, pointerPosition = null;
  let focusIndex = -1, focusPaused = false, boardVisible = true, focusVisible = false;

  function normalize(item, index) {
    const defaults = a.defaults.items[index] || {};
    return {...defaults, ...item,
      focalX: clamp(item.focalX, 0, 100, 50), focalY: clamp(item.focalY, 0, 100, 50),
      zoom: clamp(item.zoom, 100, 160, 100), intensity: clamp(item.intensity, 0, 1, .65),
      duration: clamp(item.duration, 8000, 24000, 12000), imageData: photo(item.imageData),
      imageAlt: String(item.imageAlt || '').slice(0, 180)};
  }
  state.items = state.items.map(normalize);
  state.active = Math.round(clamp(state.active, 0, total - 1, 0));
  state.layout = ['auto', 'horizontal', 'vertical'].includes(state.layout) ? state.layout : 'auto';
  state.hoverPreview = state.hoverPreview === true;
  focusDialog.id = focusDialog.id || 'eg-gallery-focus';
  focusDialog.setAttribute('aria-describedby', 'eg-focus-description');
  $('[data-focus-description]').id = 'eg-focus-description';

  const visual = (index, suffix) => '<div class="eg-visual-content">' + window.LienzoGalleryArt(index, suffix) +
    '<div class="eg-photo-depth" hidden><div class="eg-photo-motion"><img class="eg-photo" alt="" decoding="async"></div></div></div>';
  board.innerHTML = state.items.map((_, index) => '<article class="eg-panel" data-panel="' + index + '" aria-labelledby="eg-title-' + index + '">' +
    '<div class="eg-visual">' + visual(index, 'panel') + '</div><div class="eg-shade" aria-hidden="true"></div>' +
    '<button type="button" class="eg-select" data-select="' + index + '" aria-controls="eg-caption-' + index + '" aria-expanded="false" aria-pressed="false"><span class="eg-number">' + String(index + 1).padStart(2, '0') + '</span><span class="eg-rail-title"></span></button>' +
    '<button type="button" class="eg-expand" data-expand="' + index + '" aria-haspopup="dialog" aria-controls="' + focusDialog.id + '">' + a.icon('external') + '</button>' +
    '<div class="eg-panel-caption" id="eg-caption-' + index + '" inert><p class="eg-panel-category" data-panel-category></p><h2 id="eg-title-' + index + '"></h2><p class="eg-description" data-panel-description></p><a class="eg-project" data-panel-link target="_blank" rel="noopener noreferrer">' + escape(ui.openLink) + a.icon('arrow') + '</a></div></article>').join('');
  $('.eg-pagination').innerHTML = state.items.map((_, index) => '<button type="button" data-gallery-goto="' + index + '" aria-pressed="false"><span>' + String(index + 1).padStart(2, '0') + '</span></button>').join('');
  const panels = $$('[data-panel]'), buttons = $$('[data-select]'), expands = $$('[data-expand]'), pages = $$('[data-gallery-goto]');
  const hoverInput = $('[data-hover-preview]'), crop = $('[data-gallery-crop]');
  if (!$('[data-gallery-alt]')) {
    const label = document.createElement('label');
    label.className = 'eg-alt-label'; label.textContent = ui.imageAlt;
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 180;
    input.setAttribute('data-gallery-alt', ''); input.setAttribute('aria-label', ui.imageAlt);
    label.append(input); crop.prepend(label);
  }
  const focusLive = focusDialog.querySelector('[data-focus-live]') || document.createElement('p');
  focusLive.className = 'v2-sr'; focusLive.setAttribute('role', 'status');
  focusLive.setAttribute('data-focus-live', ''); focusDialog.append(focusLive);

  function cancelHover() { clearTimeout(hoverTimer); hoverTimer = 0; }
  function resetPointer(host = pointerHost) {
    if (host) { host.style.setProperty('--eg-px', '0px'); host.style.setProperty('--eg-py', '0px'); }
    if (!host || host === pointerHost) {
      cancelAnimationFrame(pointerFrame); pointerFrame = 0;
      pointerHost = null; pointerBox = null; pointerPosition = null;
    }
  }
  function canMove(host) {
    if (!fine.matches || a.reduced || a.paused || Number(state.items[state.active].intensity) <= 0 || document.hidden) return false;
    if (host === focusCanvas) return focusDialog.open && focusVisible && !focusPaused;
    return boardVisible && !focusDialog.open && host === panels[state.active] && visibility.get(host) !== false;
  }
  function pointerEnter(host, event) {
    if (event.pointerType === 'touch' || !canMove(host)) return;
    resetPointer(); pointerHost = host; pointerBox = host.getBoundingClientRect();
  }
  function pointerMove(host, event) {
    if (event.pointerType === 'touch' || !canMove(host)) return;
    if (pointerHost !== host || !pointerBox) pointerEnter(host, event);
    if (!pointerBox || !pointerBox.width || !pointerBox.height) return;
    pointerPosition = {x: event.clientX, y: event.clientY};
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (pointerHost !== host || !pointerPosition || !canMove(host)) { resetPointer(host); return; }
      const energy = state.items[state.active].intensity;
      host.style.setProperty('--eg-px', clamp((pointerPosition.x - pointerBox.left) / pointerBox.width * 2 - 1, -1, 1, 0) * 11 * energy + 'px');
      host.style.setProperty('--eg-py', clamp((pointerPosition.y - pointerBox.top) / pointerBox.height * 2 - 1, -1, 1, 0) * 8 * energy + 'px');
    });
  }
  function applyVisual(host, index) {
    const item = state.items[index];
    host.style.setProperty('--eg-accent', colors[item.accent] || colors.violet);
    host.style.setProperty('--eg-speed', String(item.duration / 12000));
    host.style.setProperty('--eg-energy', String(item.intensity));
    host.style.setProperty('--eg-photo-zoom', String(item.zoom / 100));
    host.dataset.still = String(item.intensity === 0); host.dataset.photo = String(!!item.imageData);
    const art = host.querySelector('.eg-art-original'), depth = host.querySelector('.eg-photo-depth'), image = host.querySelector('img.eg-photo');
    if (art) art.hidden = !!item.imageData;
    if (depth) depth.hidden = !item.imageData;
    if (image) {
      if (item.imageData && image.getAttribute('src') !== item.imageData) image.src = item.imageData;
      if (!item.imageData) image.removeAttribute('src');
      image.alt = item.imageAlt;
      image.style.objectPosition = item.focalX + '% ' + item.focalY + '%';
      image.style.transform = 'scale(' + item.zoom / 100 + ')';
    }
  }
  function link(node, href) {
    const destination = a.safeURL(href);
    if (destination) { node.href = destination; node.removeAttribute('aria-disabled'); node.removeAttribute('tabindex'); }
    else { node.removeAttribute('href'); node.setAttribute('aria-disabled', 'true'); node.tabIndex = -1; }
  }
  function announce(index) {
    const text = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0') + ' — ' + state.items[index].title;
    $('[data-gallery-live]').textContent = text;
    if (focusDialog.open) focusLive.textContent = text;
  }
  function scrollSelected() {
    cancelAnimationFrame(scrollFrame);
    if (effectiveLayout() !== 'horizontal' || !narrow.matches) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (board.scrollWidth <= board.clientWidth + 1) return;
      const box = board.getBoundingClientRect(), panel = panels[state.active].getBoundingClientRect();
      const left = board.scrollLeft + panel.left - box.left - (board.clientWidth - panel.width) / 2;
      board.scrollTo({left: Math.max(0, left), behavior: a.reduced || a.paused ? 'instant' : 'smooth'});
    });
  }
  function motion() {
    const paused = a.paused || focusDialog.open || !boardVisible;
    gallery.dataset.paused = String(paused);
    panels.forEach((panel, index) => {
      const play = !paused && index === state.active && visibility.get(panel) !== false && state.items[index].intensity > 0;
      panel.style.setProperty('--eg-art-play', play ? 'running' : 'paused');
    });
    const stopFocus = !focusDialog.open || !focusVisible || focusPaused || a.paused || a.reduced || document.hidden || state.items[state.active].intensity === 0;
    focusDialog.dataset.paused = String(stopFocus);
    focusDialog.style.setProperty('--eg-art-play', stopFocus ? 'paused' : 'running');
    focusCanvas.style.setProperty('--eg-art-play', stopFocus ? 'paused' : 'running');
    focusArt.style.setProperty('--eg-art-play', stopFocus ? 'paused' : 'running');
    const pause = $('[data-focus-pause]');
    pause.textContent = focusPaused ? ui.resume : ui.pause; pause.setAttribute('aria-pressed', String(focusPaused));
    pause.disabled = a.reduced || a.paused || state.items[state.active].intensity === 0;
    if (paused || a.reduced) cancelHover();
    if (pointerHost && !canMove(pointerHost)) resetPointer();
  }
  function renderFocus() {
    if (!focusDialog.open) return;
    if (focusIndex !== state.active || !focusArt.firstElementChild) {
      resetPointer(); focusArt.innerHTML = '<div class="eg-visual">' + visual(state.active, 'focus') + '</div>'; focusIndex = state.active;
    }
    const item = state.items[state.active];
    applyVisual(focusCanvas, state.active);
    focusDialog.dataset.still = String(item.intensity === 0); focusArt.dataset.still = String(item.intensity === 0);
    a.text('[data-focus-title]', item.title); a.text('[data-focus-category]', item.category); a.text('[data-focus-description]', item.description);
    link($('[data-focus-link]'), item.href);
  }
  function outputFor(key, value) {
    if (key === 'duration') return new Intl.NumberFormat(document.documentElement.lang, {maximumFractionDigits: 1}).format(value / 1000) + ' s';
    return Math.round(key === 'intensity' ? value * 100 : value) + '%';
  }
  function render() {
    const item = state.items[state.active], layout = effectiveLayout();
    board.dataset.layout = layout; board.dataset.preference = state.layout;
    board.style.setProperty('--eg-tracks', state.items.map((_, index) => index === state.active ? '5.5fr' : '1fr').join(' '));
    $$('button[data-layout]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === state.layout)));
    hoverInput.checked = state.hoverPreview; hoverInput.disabled = !fine.matches;
    hoverInput.title = fine.matches ? ui.hoverPreview : ui.hoverUnavailable;
    panels.forEach((panel, index) => {
      const selected = index === state.active, data = state.items[index];
      panel.dataset.active = String(selected); applyVisual(panel, index);
      const selectButton = buttons[index];
      selectButton.setAttribute('aria-pressed', String(selected)); selectButton.setAttribute('aria-expanded', String(selected));
      selectButton.setAttribute('aria-label', ui.selectPanel + ': ' + data.title);
      selectButton.querySelector('.eg-rail-title').textContent = data.title;
      expands[index].setAttribute('aria-label', ui.expandPanel + ': ' + data.title);
      expands[index].tabIndex = selected ? 0 : -1; expands[index].setAttribute('aria-hidden', String(!selected));
      const caption = panel.querySelector('.eg-panel-caption');
      caption.inert = !selected; caption.setAttribute('aria-hidden', String(!selected));
      panel.querySelector('h2').textContent = data.title;
      panel.querySelector('[data-panel-category]').textContent = data.category;
      panel.querySelector('[data-panel-description]').textContent = data.description;
      link(panel.querySelector('[data-panel-link]'), data.href);
      pages[index].setAttribute('aria-pressed', String(selected)); pages[index].setAttribute('aria-label', ui.selectPanel + ': ' + data.title);
    });
    a.text('[data-gallery-count]', String(state.active + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0'));
    for (const selector of ['[data-gallery-name]', '[data-gallery-settings-title]', '[data-gallery-photo-title]']) a.text(selector, item.title);
    a.text('[data-gallery-image-state]', loading[state.active] ? ui.loadingPhoto : item.imageData ? ui.customPhoto : ui.originalArt);
    $('[data-remove-image]').disabled = !item.imageData && !loading[state.active];
    $('[data-gallery-download]').disabled = loading[state.active]; crop.hidden = !item.imageData;
    $('[data-gallery-alt]').value = item.imageAlt;
    $$('[data-gallery-setting]').forEach(control => {
      const key = control.dataset.gallerySetting, formatted = outputFor(key, item[key]);
      control.value = String(item[key]); const output = $('[data-gallery-output="' + key + '"]');
      if (output) output.textContent = formatted;
      control.setAttribute('aria-valuetext', formatted);
    });
    renderFocus(); motion();
  }
  function select(index, {user = true, focus = false, scroll = true} = {}) {
    if (editor.open || sourceDialog.open) return;
    const next = (index + total) % total;
    cancelHover(); if (next !== state.active) resetPointer();
    state.active = next; a.paint();
    if (user) announce(next);
    if (focus) buttons[next].focus({preventScroll: effectiveLayout() === 'horizontal' && narrow.matches});
    if (scroll && !focusDialog.open) scrollSelected();
  }
  panels.forEach((panel, index) => {
    visibility.set(panel, true);
    buttons[index].addEventListener('click', () => select(index));
    expands[index].addEventListener('click', () => openFocus(index));
    panel.addEventListener('pointerenter', event => {
      pointerEnter(panel, event);
      if (!state.hoverPreview || !fine.matches || event.pointerType === 'touch' || a.paused || focusDialog.open || index === state.active) return;
      cancelHover();
      hoverTimer = setTimeout(() => {
        hoverTimer = 0;
        if (!a.paused && !focusDialog.open && state.hoverPreview && fine.matches) select(index, {user: true, scroll: false});
      }, 160);
    });
    panel.addEventListener('pointermove', event => pointerMove(panel, event));
    panel.addEventListener('pointerleave', () => { cancelHover(); resetPointer(panel); });
    pages[index].addEventListener('click', () => select(index));
  });
  board.addEventListener('keydown', event => {
    const index = buttons.indexOf(document.activeElement);
    if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    const horizontal = effectiveLayout() === 'horizontal'; let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = total - 1;
    else if (event.key === (horizontal ? 'ArrowRight' : 'ArrowDown')) next = index + 1;
    else if (event.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) next = index - 1;
    else return;
    event.preventDefault(); select(next, {focus: true});
  });
  $('[data-gallery-previous]').addEventListener('click', () => select(state.active - 1));
  $('[data-gallery-next]').addEventListener('click', () => select(state.active + 1));
  $$('button[data-layout]').forEach(button => button.addEventListener('click', () => {
    cancelHover(); resetPointer(); state.layout = button.dataset.layout; a.paint(); scrollSelected();
  }));
  hoverInput.addEventListener('change', () => {
    state.hoverPreview = fine.matches && hoverInput.checked; cancelHover(); a.paint();
    if (!fine.matches) a.status(ui.hoverUnavailable);
  });
  $$('[data-gallery-setting]').forEach(control => control.addEventListener('input', () => {
    const key = control.dataset.gallerySetting;
    state.items[state.active][key] = clamp(control.value, Number(control.min), Number(control.max), state.items[state.active][key]); a.paint();
  }));
  $('[data-gallery-alt]').addEventListener('input', event => { state.items[state.active].imageAlt = event.target.value.slice(0, 180); a.paint(); });
  $('[data-reset-crop]').addEventListener('click', () => { Object.assign(state.items[state.active], {focalX: 50, focalY: 50, zoom: 100}); a.paint(); });
  $('[data-upload]').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    const index = state.active, token = ++uploads[index]; loading[index] = true; a.paint();
    try {
      const image = photo(await a.imageFile(file));
      if (uploads[index] !== token) return;
      if (!image) throw new Error(ui.imageError);
      Object.assign(state.items[index], {imageData: image, imageAlt: '', focalX: 50, focalY: 50, zoom: 100});
      a.status(ui.imageDone + ' ' + state.items[index].title);
    } catch (error) {
      if (uploads[index] === token) a.status(error.message || ui.imageError);
    } finally {
      if (uploads[index] === token) { loading[index] = false; a.paint(); }
    }
  });
  $('[data-remove-image]').addEventListener('click', () => {
    const index = state.active; uploads[index]++; loading[index] = false;
    Object.assign(state.items[index], {imageData: '', imageAlt: '', focalX: 50, focalY: 50, zoom: 100});
    a.paint(); a.status(ui.photoRemoved);
  });
  function openFocus(index) {
    if (editor.open || sourceDialog.open || focusDialog.open) return;
    select(index, {scroll: false}); cancelHover(); resetPointer(); focusPaused = false; focusIndex = -1;
    focusDialog.showModal(); renderFocus(); motion(); $('[data-focus-close]').focus({preventScroll: true});
  }
  $('[data-focus-close]').addEventListener('click', () => focusDialog.close());
  focusDialog.addEventListener('click', event => {
    if (event.target !== focusDialog) return;
    const box = focusDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) focusDialog.close();
  });
  focusDialog.addEventListener('close', () => {
    resetPointer(); focusArt.replaceChildren(); focusIndex = -1; focusPaused = false; focusLive.textContent = '';
    motion(); expands[state.active].focus({preventScroll: true}); scrollSelected();
  });
  $('[data-focus-previous]').addEventListener('click', () => select(state.active - 1, {scroll: false}));
  $('[data-focus-next]').addEventListener('click', () => select(state.active + 1, {scroll: false}));
  $('[data-focus-pause]').addEventListener('click', () => { focusPaused = !focusPaused; motion(); });
  focusCanvas.addEventListener('pointerenter', event => pointerEnter(focusCanvas, event));
  focusCanvas.addEventListener('pointermove', event => pointerMove(focusCanvas, event));
  focusCanvas.addEventListener('pointerleave', () => resetPointer(focusCanvas));
  focusDialog.addEventListener('keydown', event => {
    if (event.target.matches('input,textarea,select') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); select(state.active + (event.key === 'ArrowRight' ? 1 : -1), {scroll: false});
    }
  });
  for (const selector of ['[data-edit]', '[data-source]']) {
    $(selector).addEventListener('click', event => {
      cancelHover(); resetPointer();
      if (focusDialog.open) { event.preventDefault(); event.stopImmediatePropagation(); }
      else if (selector === '[data-source]' && loading.some(Boolean)) {
        event.preventDefault(); event.stopImmediatePropagation(); a.status(ui.loadingPhoto);
      }
    }, true);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === board) boardVisible = entry.isIntersecting;
      else if (entry.target === focusCanvas) focusVisible = entry.isIntersecting;
      else visibility.set(entry.target, entry.isIntersecting);
    }); motion();
  }, {threshold: 0});
  panels.forEach(panel => observer.observe(panel));
  observer.observe(board); observer.observe(focusCanvas);
  a.root.addEventListener('v2:motion', motion);
  narrow.addEventListener('change', () => { resetPointer(); a.paint(); scrollSelected(); });
  fine.addEventListener('change', () => { cancelHover(); resetPointer(); a.paint(); });
  window.addEventListener('resize', () => { resetPointer(); scrollSelected(); }, {passive: true});
  window.addEventListener('pagehide', () => { cancelHover(); resetPointer(); cancelAnimationFrame(scrollFrame); });

  function downloadPanel() {
    const index = state.active, item = normalize(state.items[index], index);
    const data = JSON.parse($('[data-config]').textContent).galleryExport;
    if (!data?.css || !data?.fonts) return;
    const accent = colors[item.accent] || colors.violet, light = document.documentElement.dataset.theme === 'light';
    const paper = light ? '#f5f3fa' : '#111018', ink = light ? '#201c2b' : '#f7f5ff';
    const art = item.imageData
      ? '<div class="eg-photo-depth"><div class="eg-photo-motion"><img class="eg-photo" alt="' + escape(item.imageAlt) + '" src="' + escape(item.imageData) + '" style="object-position:' + item.focalX + '% ' + item.focalY + '%;transform:scale(' + item.zoom / 100 + ')"></div></div>'
      : window.LienzoGalleryArt(index, 'download');
    const fontCSS = ['Fraunces', 'Instrument'].map(name => '@font-face{font-family:' + name + ';src:url(data:font/woff2;base64,' + data.fonts[name] + ') format("woff2");font-weight:100 900;font-display:swap}').join('\n');
    const styles = fontCSS + '\n' + data.css + '\n' + [
      '*{box-sizing:border-box}body{margin:0;padding:clamp(18px,4vw,56px);background:' + paper + ';color:' + ink + ';font:16px/1.6 Instrument,sans-serif}',
      '.eg-export{max-width:1100px;margin:auto;--eg-accent:' + accent + ';--eg-speed:' + item.duration / 12000 + ';--eg-energy:' + item.intensity + ';--eg-art-play:running;--eg-px:0;--eg-py:0}',
      '.eg-export-visual{position:relative;isolation:isolate;overflow:hidden;border-radius:22px;aspect-ratio:6/5;max-height:76vh;min-height:300px;background:#111}',
      '.eg-art-original,.eg-photo-depth,.eg-photo-motion{position:absolute;inset:0}.eg-photo-depth{transform:translate(calc(var(--eg-px,0) * 6.05px),calc(var(--eg-py,0) * 4.4px)) scale(1.04)}.eg-photo-motion{animation:eg-export-photo calc(22s * var(--eg-speed,1)) ease-in-out infinite}.eg-photo{width:100%;height:100%;object-fit:cover;display:block}',
      '.eg-depth-back{transform:translate(calc(var(--eg-px,0) * -1.98px),calc(var(--eg-py,0) * -1.44px))}.eg-depth-middle{transform:translate(calc(var(--eg-px,0) * 3.85px),calc(var(--eg-py,0) * 2.8px))}.eg-depth-front{transform:translate(calc(var(--eg-px,0) * 8.25px),calc(var(--eg-py,0) * 6px))}',
      '.eg-export-visual *,.eg-export-visual *::before,.eg-export-visual *::after{animation-play-state:var(--eg-art-play,paused)!important}',
      '.eg-export-copy{padding-top:28px}.eg-export-category{font-size:11px;text-transform:uppercase;letter-spacing:.13em;color:' + accent + ';margin:0 0 12px}h1{font-family:Fraunces,serif;font-weight:500;font-size:clamp(34px,5vw,56px);letter-spacing:normal;line-height:1.12;margin:0 0 16px;overflow-wrap:anywhere}.eg-export-copy>p:not(.eg-export-category){max-width:750px;margin:0 0 24px;opacity:.8;overflow-wrap:anywhere}',
      '.eg-export-actions{display:flex;align-items:center;flex-wrap:wrap;gap:14px}button,a{font:inherit;min-height:44px;border:1px solid ' + accent + ';border-radius:10px;background:transparent;color:inherit;padding:10px 16px;text-decoration:none;cursor:pointer}a{display:inline-flex;align-items:center}button:focus-visible,a:focus-visible{outline:3px solid ' + accent + ';outline-offset:4px}button:disabled{opacity:.65;cursor:default}footer{font-size:12px;opacity:.7;margin-top:30px}',
      '.eg-export[data-still=true] .eg-export-visual *{animation:none!important}.eg-export[data-paused=true] .eg-depth-back,.eg-export[data-paused=true] .eg-depth-middle,.eg-export[data-paused=true] .eg-depth-front{transition:none}',
      '@keyframes eg-export-photo{0%,100%{transform:scale(1)}50%{transform:scale(calc(1 + .025 * var(--eg-energy,.65)))}}@media(prefers-reduced-motion:reduce){.eg-export-visual *,.eg-export-visual *::before,.eg-export-visual *::after{animation:none!important;transition:none!important}}@media(max-width:600px){.eg-export-visual{min-height:320px;max-height:none;aspect-ratio:4/5}}'
    ].join('\n');
    const labels = json({pause: ui.pause, resume: ui.resume});
    const script = '(()=>{"use strict";const root=document.querySelector(".eg-export"),visual=document.querySelector(".eg-export-visual"),button=document.querySelector("button"),labels=' + labels + ',energy=' + item.intensity + ',reduced=matchMedia("(prefers-reduced-motion:reduce)"),fine=matchMedia("(hover:hover) and (pointer:fine)");let paused=false,visible=true,frame=0,box=null,point=null;' +
      'function reset(){cancelAnimationFrame(frame);frame=0;point=null;box=null;root.style.setProperty("--eg-px","0");root.style.setProperty("--eg-py","0");}function stopped(){return paused||reduced.matches||document.hidden||!visible||root.dataset.still==="true";}function sync(){const stop=stopped();root.style.setProperty("--eg-art-play",stop?"paused":"running");root.dataset.paused=String(stop);button.textContent=paused?labels.resume:labels.pause;button.setAttribute("aria-pressed",String(paused));button.disabled=reduced.matches||root.dataset.still==="true";if(stop)reset();}' +
      'button.addEventListener("click",()=>{paused=!paused;sync();});visual.addEventListener("pointerenter",e=>{if(e.pointerType!=="touch"&&fine.matches&&!stopped())box=visual.getBoundingClientRect();});visual.addEventListener("pointermove",e=>{if(e.pointerType==="touch"||!fine.matches||stopped())return;box=box||visual.getBoundingClientRect();point={x:e.clientX,y:e.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(stopped()||!point||!box)return;const x=Math.max(-1,Math.min(1,(point.x-box.left)/box.width*2-1)),y=Math.max(-1,Math.min(1,(point.y-box.top)/box.height*2-1));root.style.setProperty("--eg-px",String(x*energy));root.style.setProperty("--eg-py",String(y*energy));});});visual.addEventListener("pointerleave",reset);window.addEventListener("resize",reset,{passive:true});document.addEventListener("visibilitychange",sync);reduced.addEventListener("change",sync);fine.addEventListener("change",reset);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(visual);sync();})();';
    const destination = a.safeURL(item.href);
    const html = '<!doctype html><html lang="' + escape(document.documentElement.lang) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escape(item.title) + ' · Lienzo</title><style>' + styles + '</style></head><body><main class="eg-export" data-still="' + String(item.intensity === 0) + '"><div class="eg-export-visual">' + art + '</div><section class="eg-export-copy"><p class="eg-export-category">' + escape(item.category) + '</p><h1>' + escape(item.title) + '</h1><p>' + escape(item.description) + '</p><div class="eg-export-actions"><button type="button" aria-pressed="false">' + escape(ui.pause) + '</button>' + (destination ? '<a href="' + escape(destination) + '" target="_blank" rel="noopener noreferrer">' + escape(ui.openLink) + ' ↗</a>' : '') + '</div></section><footer>' + escape(ui.galleryStandaloneCredit) + '</footer></main><script type="application/json" data-licenses>' + json(data.notices) + '</script><script>' + script + '</script></body></html>';
    const slug = String(item.title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 72).toLowerCase() || 'lienzo';
    a.download(html, 'lienzo-panel-' + String(index + 1).padStart(2, '0') + '-' + slug + '.html'); a.status(ui.galleryDownloaded);
  }
  $('[data-gallery-download]').addEventListener('click', downloadPanel);
  a.setup({render, reset(index) {
    uploads[index]++; loading[index] = false; state.items[index] = normalize(structuredClone(a.defaults.items[index]), index);
  }, fields: [
    {key: 'title', label: ui.title, required: true, maxLength: 56, wide: true},
    {key: 'category', label: ui.category, maxLength: 36, wide: true},
    {key: 'description', label: ui.description, type: 'textarea', maxLength: 180, wide: true},
    {key: 'href', label: ui.href, url: true, required: true, maxLength: 400, wide: true},
    {key: 'accent', label: ui.accent, options: Object.keys(colors).map(key => [key, ui[key]])}
  ]});
})();

