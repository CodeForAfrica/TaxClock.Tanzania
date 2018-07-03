// Tanzania explanations for items
var itemExplanations = {
	'finance' : 'Finance Tax',
	'tamisemi' : 'TAMISEMI',
	'transport-and-communication' : 'Transport and Communication Tax',
	'army' : 'Army Tax',
	'education' : 'Education Tax',
	'health' : 'Health Tax',
	'energy': 'Energy Tax',
	'minerals': 'Minerals Tax',
	'internal-affairs' : 'Internal Affairs Tax',
	'external-affairs' : 'External Affairs Tax',
	'democracy-and-good-governance' : 'Democracy and Good Governance',
	'constitution-and-legal-affairs' : 'Constitution and Legal Affairs',
	'water-and-irrigation' : 'Water and Irrigation Tax',
	'agriculture' : 'Agriculture Tax',
	'livestosk-and-fisheries' : 'Livestock and Fisheries Tax',
	'prime-minister-office' : 'Prime Minister Office Tax',
	'tourism' : 'Tourism Tax',
	'industries-and-business' : 'Industries and Business Tax',
	'parliament' : 'Parliament Tax',
	'lands' : 'Lands Tax',
	'sports' : 'Sports Tax',
	'vice-president-office' : 'Vice President Office Tax',
	'vice-president' : 'Vice President Tax',
	'fedha' : 'Kodi ya Fedha',
	'usafiri-na-habari' : 'Kodi ya Usafiri na Habari',
	'jeshi' : 'Kodi ya Jeshi',
	'elimu' : 'Kodi ya Elimu',
	'afya' : 'Kodi ya Afya',
	'nishati': 'Kodi ya Nishati',
	'madini': 'Kodi ya Madini',
	'mambo-ya-ndani' : 'Kodi ya Mambo ya Ndani',
	'mambo-ya-nje' : 'Kodi ya Mambo ya Nje',
	'demokrasia-na-utawala-bora' : 'Kodi ya Demokrasia na Utawala Bora',
	'katiba-na-sheria' : 'Kodi ya Katiba na Sheria',
	'maji-na-umwagiliaji' : 'Kodi ya Maji na Umwagiliaji',
	'kilimo' : 'Kodi ya Kilimo',
	'ufugaji-na-uvuvi' : 'Kodi ya Ufugaji na Uvuvi',
	'ofisi-ya-waziri-mkuu' : 'Kodi ya Ofisi ya Waziri Mkuu',
	'utalii' : 'Kodi ya Utalii',
	'viwanda-na-biashara' : 'Kodi ya Viwanda na Utalii',
	'bunge' : 'Kodi ya Bunge',
	'ardhi' : 'Kodi ya Ardhi',
	'michezo' : 'Kodi ya Michezo',
	'ofisi-ya-makamu-wa-raisi' : 'Kodi ya Ofisi ya Makamu wa Raisi',
	'makamu-wa-raisi' : 'Kodi ya Makamu wa Raisi'
};

var cal = null;

function Slugify(str) {
	var $slug = '';
	var trimmed = $.trim(str);
	$slug = trimmed.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
	return $slug.toLowerCase();
}

function GetHours(mins) {
	var hours = Math.floor(mins / 60);
	return hours;
}

function GetMinutes(mins) {
	var minutes = Math.floor(mins % 60);
	return minutes;
}

function GetSeconds(mins) {
	var seconds = Math.floor((mins * 60) % 60);
	return seconds;
}

function workingOn(now, items, calc) {
	// of the items in items, what is being worked on now?
	var current = 0,
	    next;

	// sort by end time
	items = _.sortBy(items, function(x) {
		return x.valueOf();
	});

	for (var i = 0; i < items.length; i++) {
		if (now.isBefore(items[i].finish_time)) {
			current = i;
			break;
		}
	}

	if (current < items.length) {
		next = items[current + 1];
	}
	current = items[current];

	if (now.isBefore(calc.START_OF_DAY) || now.isAfter(calc.END_OF_DAY)) {
		next = current;
		current = null;
	}

	return [current, next];
}

function checkEmbedLink() {
	if (window.location.search.indexOf('embed-link') > -1) {
		allowEmbedLink();
	}
}

function allowEmbedLink() {
	$('.embed-link').addClass('allowed');
}

function createICS(breakdown) {
	var num_slots = breakdown.length;
	var secondlast_slot_start = breakdown[num_slots - 2].finish_time;
	var end_day = breakdown[num_slots - 1].finish_time;
	cal = icsFormatter();
	cal.addEvent('Working for yourself', 'Every minute from now on, you\'re working for yourself', 'Work', secondlast_slot_start, end_day, 'RRULE:FREQ=DAILY;INTERVAL=1');

	return cal;
}

function downloadICS() {
	ga('send', 'event', 'taxclock', 'ics');
	cal.download();
}

var pymChild;
pymChild = new pym.Child({
	id : 'codeforkenya-embed-taxclock'
});
checkEmbedLink();

var engaged = false;

var firstLoop = true;
var output;

function incomeChange() {
	var income = parseFloat($('input[name="income"]').val());

	console.log(income);
	// Checking if income is below TZS 170001
	if(isNaN(income) || (income < 170001)){
		$('.tax-div').css('border-color','#ED1C24');
	}
	else{
		$('.tax-div').css('border-color','#fff');
	}

	var calc = new IncomeCalculator();

	output = calc.calculateIncomeBreakdown(income);
	var currentLang = output.currentLang;

	console.log(output);

	cal = createICS(output.breakdown);
	var startTime = calc.START_OF_DAY;

	/* Clear output */
	$('#output-wrapper').hide();

	if (income > 0) {
		$('#output-dayplanner').html('');

		$(output.breakdown).each(function() {
			var breakdown = this;
			$(breakdown).each(function() {

				var name = this.name;
				var slug = Slugify(this.name);
				var finishTime = this.finish_time;
				var taxamount = this.taxpayer_amount;

				var startTimeStr = startTime.format('h:mm a');

				var startHour = startTime.format('H');
				var startMinute = startTime.format('m');
				var startSecond = startTime.format('s');

				var finishHour = finishTime.format('H');
				var finishMinute = finishTime.format('m');
				var finishSecond = finishTime.format('s');

				var mins = this.minutes;
				var hours = GetHours(mins);
				var minutes = GetMinutes(mins);
				var seconds = GetSeconds(mins);

				/* if minutes > 0 and seconds > 30, round up a 1 minute */
				if (minutes > 0 && seconds > 30) {
					minutes = minutes + 1;
					seconds = 0;
				} else if (minutes > 0) {
					seconds = 0;
				}

				var hoursString = "";
				var minutesString = "";
				var secondsString = "";

				if (hours > 0) {
					var hoursString = '';
					if(currentLang == "sw"){
						hoursString = '<span class="item-hours"> Masaa ' + hours + '</span>';
					}
					else{
						hoursString = '<span class="item-hours">' + hours + ' hours </span>';
					}
				}

				if (hours == 1) {
					var hoursString = '';
					if(currentLang == "sw"){
						hoursString = '<span class="item-hours"> Saa ' + hours + '</span>';
					}
					else{
						hoursString = '<span class="item-hours">' + hours + ' hour </span>';
					}
				}

				if (minutes > 0) {
					var minutesString = '';
					if(currentLang == "sw"){
						minutesString = '<span class="item-minutes"> Dakika ' + minutes + '</span>';
					}
					else{
						minutesString = '<span class="item-minutes">' + minutes + ' minutes </span>';
					}
				}

				if (minutes == 1) {
					if(currentLang == "sw"){
						minutesString = '<span class="item-minutes"> Dakika ' + minutes + '</span>';
					}
					else{
						minutesString = '<span class="item-minutes">' + minutes + ' minute </span>';
					}
				}

				if (seconds > 0) {
					var secondsString = '';
					if(currentLang == "sw"){
						secondsString = '<span class="item-seconds"> Sekunde ' + seconds + '</span>';
					}
					else{
						secondsString = '<span class="item-seconds">' + seconds + ' seconds</span>';
					}
				}

				if (seconds == 1) {
					var secondsString = '';
					if(currentLang == "sw"){
						secondsString = '<span class="item-seconds"> Sekunde ' + seconds + '</span>';
					}
					else{
						secondsString = '<span class="item-seconds">' + seconds + ' second </span>';
					}
				}

				var durationDiv = '<div class="item-duration">' + hoursString + minutesString + secondsString + '</div>';

				var rowHeight = Math.floor(mins * 14);
				if (rowHeight > 450) {
					rowHeight = 450;
				}

				'Add a class for small items (under 5 minutes)'
				var smallClass = "";
				if (minutes < 5) {
					smallClass = " item-small";
				}

				$('#output-dayplanner').append('<div class="item planner-item" id="' + slug + '" style="min-height: ' + rowHeight + 'px;" data-starthour="' + startHour + '" data-startminute="' + startMinute + '" data-startsecond="' + startSecond + '" data-finishhour="' + finishHour + '" data-finishminute="' + finishMinute + '" data-finishsecond="' + finishSecond + '"><div class="item-starttime-wrapper"><span class="item-starttime">' + startTimeStr + '</span></div><div class="item-details"><div class="item-name">' + name + '</div><div class="item-duration">' + durationDiv + "</div></div></div>");

				startTime = this.finish_time;
			});
		});

		// Dayplanner words translation
		if(currentLang == "sw"){
			var start_of_the_work_day_str = "MWANZO WA SIKU YA KAZI";
			var end_of_the_work_day_str = "MWISHO WA SIKU YA KAZI";
			var end_of_the_work_day_str_capitalized = "Mwisho wa siku ya kazi";
			var time_now = "Muda Sasa";
			var put_your_feet_up = "Weka miguu yako juu, ulikuwa na siku ndefu ya kufanya kazi na kuichangia serikali.";
			var brace_yourself = "Jipe moyo mwenyewe, una siku ndefu mbele yako.";
		}
		else{
			var start_of_the_work_day_str = "START OF THE WORK DAY";
			var end_of_the_work_day_str = "END OF THE WORK DAY";
			var end_of_the_work_day_str_capitalized = "End of the work day";
			var time_now = "Time Now";
			var put_your_feet_up = "Put your feet up, you’ve had a long day working and contributing to the state.";
			var brace_yourself = "Brace yourself, you have a long day ahead of you.";
		}

		$('#output-dayplanner').prepend('<div class="item" id="start"><strong>8am</strong> - '+ start_of_the_work_day_str +'</div>').append('<div class="item" id="end"><strong>5pm</strong> - '+ end_of_the_work_day_str +'</div>');

		/* update clock */
		function tick() {
			var now = moment();
			$('#clock-now').text(now.format('HH:mm'));

			// draw current-time 'now' line
			$('#output-dayplanner .planner-item').each(function() {

				var startHour = parseInt($(this).attr('data-starthour'));
				var startMinute = parseInt($(this).attr('data-startminute'));
				var startSecond = parseInt($(this).attr('data-startsecond'));

				var startSeconds = (startHour * 60 * 60) + (startMinute * 60) + startSecond;

				var finishHour = parseInt($(this).attr('data-finishhour'));
				var finishMinute = parseInt($(this).attr('data-finishminute'));
				var finishSecond = parseInt($(this).attr('data-finishsecond'));

				var finishSeconds = (finishHour * 60 * 60) + (finishMinute * 60) + finishSecond;

				var nowHour = parseInt(now.format('H'));
				var nowMinute = parseInt(now.format('m'));
				var nowSecond = parseInt(now.format('s'));

				var nowSeconds = (nowHour * 60 * 60) + (nowMinute * 60) + nowSecond;

				if (nowSeconds < finishSeconds && nowSeconds >= startSeconds) {
					elementHeight = $(this).height() - 12;
					topPosition = Math.round((nowSeconds - startSeconds) / (finishSeconds - startSeconds) * elementHeight) + 12;
					$('#now-line').remove();
					$(this).prepend('<div id="now-line" title="' + now.format('hh:mm a') + '" style="top: ' + topPosition + 'px;"><span>'+ time_now +'</span></div>');
				}

			});

			// current and next work items
			var pair = workingOn(now, output.breakdown, calc);

			if (pair[0]) {
				$('#clock-next-wrapper, #working-on').show();
				$('#clock-item').show().text(pair[0].name);
			} else {
				$('#clock-next-wrapper, #working-on').hide();
				$('#clock-item').text(put_your_feet_up);
				// show morning message (after 4 am)

				var nowHour = parseInt(now.format('H'));
				if (nowHour >= 4 && nowHour < 9) {
					$('#clock-item').text(brace_yourself);
				}
			}

			$('#clock-next').text(pair[1] ? pair[1].name : end_of_the_work_day_str_capitalized);

			TC.colors.setSchedule();
		};

		// update it now
		tick();

		if (firstLoop) {
			// update it every 1 second
			setInterval(tick, 1000);
			firstLoop = false;
		}

		// Add explanations
		$('.planner-item').each(function() {
			var itemID = $(this).attr('id');
			var explanation = itemExplanations[itemID];

			var itemHeight = parseInt($(this).css('min-height'));

			if (itemID != 'working-for-yourself') {
				if (itemHeight > 80) {
					$(this).find('.item-details').append('<div class="item-explanation"><span class="what-is-this">?</span> ' + explanation + '</div>');
				} else {
					$(this).find('.item-name').append('<span class="explanation-icon" data-toggle="tooltip" title="' + explanation + '">?</span>');
				}
			}

			// Activate tooltips
			$('[data-toggle="tooltip"]').tooltip();

		});

		/* Show the output */
		$('#output-wrapper').show();
		ga('send', 'event', 'taxclock', 'salary', $('input[name="income"]').val());

		if (!engaged) {
			ga('send', 'event', 'taxclock', 'engaged');
		}
		engaged = true;

		// tell pym to resize
		// pymChild.sendHeight();
	} else {
		var footer = $('.footer');
		pymChild.sendMessage("childShrank", footer.offset().top + footer.height());
	}
}

if (window != window.top) {
	$('body').addClass('embedded');
} else {
	$('body').addClass('standalone');
}

var pat = new RegExp("embed.html$");

$(function() {

	$('input[name="income"]').on('change keyup', function() {
		
			incomeChange();
			TC.clock.update();
		
	});
	
	$('input[name="embed-income"]').on('change', function() {
		if (pat.test(window.location) || $('body').hasClass("embedded")) {
			var updated_income = $('input[name="embed-income"]').val();
			window.location = "https://taxclock.codeforkenya.org/?income=" + updated_income;
		};});
	
	
	/* Stupid hack to probably fix size once probably rendered initially */
	// setInterval(function() { pymChild.sendHeight(); }, 1000);
});
