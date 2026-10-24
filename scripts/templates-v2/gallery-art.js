/* Five original Lienzo landscapes. SVG geometry, gradients, and CSS motion only. */
(() => {
  'use strict';

  const VIOLET = 'var(--violet,#8b7bff)', DEEP = 'var(--brand-deep,#6e5df2)', MINT = 'var(--mint,#35d6c8)', AMBER = 'var(--amber,#ffb454)';
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
    const accent = 'var(--eg-accent,var(--violet,#8b7bff))';
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
    const accent = 'var(--eg-accent,var(--mint,#35d6c8))';
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
    const accent = 'var(--eg-accent,var(--amber,#ffb454))';
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
    const accent = 'var(--eg-accent,var(--violet,#8b7bff))';
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
    const accent = 'var(--eg-accent,var(--mint,#35d6c8))';
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
