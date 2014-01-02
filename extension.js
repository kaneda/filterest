appAPI.ready(function($) {
	// If we're on pinterest.com (IMPORTANT!)
    if (!appAPI.matchPages("pinterest.com") && !appAPI.matchPages("www.pinterest.com")) return;
    
    /*
     * Global Vars
     */
    // bad_words --> bad_words[some_word] = true;
    var bad_words = appAPI.db.get('filter_dict');
    if(bad_words === null || bad_words === undefined) {
		bad_words = {};
    }
    
    var good_words = appAPI.db.get('unfilter_dict');
    if(good_words === null || good_words === undefined) {
		good_words = {};
    }
    
    // if skip blank then pictures without keywords will be removed
    var skipBlanks = appAPI.db.get('skip_blank');
    
	var cons = { "after":true, "although":true, "as":true, "if":true, "though":true, "because":true, "before":true, 
    "by":true, "even":true, "that":true, "lest":true, "once":true, "only":true, "since":true, "so":true, "than":true, 
    "then":true, "unless":true, "until":true, "both":true, "and":true, "either":true, "or":true, "neither":true, 
    "nor":true, "not":true, "also":true, "whether":true , "it":true, "are":true, "is":true, "the":true, "in":true, 
    "a":true, "to":true, "from":true, "who":true, "what":true, "when":true, "where":true, "why":true, "your":true, 
    "into":true, "for":true, "with":true, "these":true, "of":true, "i":true, "on":true, "at":true, "us":true, "do":true, 
    "off":true, "this":true, "has":true, "many":true, "all":true, "be":true
	};
	
	/*
	*  Useful functions
	*/
	function processDescription(target, override) {
		var isEmpty = false;
		var bad_entry = false;
		
		var imageDesc = $(target).find(".pinDescription").text().toLowerCase();
		if(!imageDesc) {
			imageDesc = $(target).find('.pinImg').attr('alt').toLowerCase();
			
			if(!imageDesc) {
				isEmpty = true;
			}
		}
		
		var altList = {};
		if(isEmpty) {
			if(skipBlanks) {
				bad_entry = true;
			}
		} else {
			var splitAlt = imageDesc.split(getDelimiter(imageDesc));
			bad_entry=false;
			for(var j=0; j<splitAlt.length; j+=1) { 
				tmpWord = stripChars(splitAlt[j]);
				if(!tmpWord || tmpWord.length === 0) { continue; }
				if(good_words[tmpWord]) {
					bad_entry = false;
					break;
				} else if(bad_words[tmpWord]) { 
					bad_entry=true;
				} else if(!cons[tmpWord]) {
					altList[tmpWord] = true;
				}
			}
		}
		
		if(bad_entry) {
			$(target).css('display','none');
		} else {
			$(target).css('display','block');
			if(override) { return; }
			for(var cKeyword in altList) {
				if(altList.hasOwnProperty(cKeyword) && altList[cKeyword]) {
					var cInnerHTML = $('<div id="'+cKeyword+'" class="filterKeyword" />');
					cInnerHTML.html("x " + cKeyword);
					$(target).append(cInnerHTML);
				}
			}
		}
    }
    
    // Currently refreshes every div:
    function refreshFilter(override) {
		var imgArray = $('.GridItems .Pin');
		for(var i=0; i<imgArray.length; i+=1 ) {
			processDescription(imgArray[i], override);
		}
    }
    
    // Generic sizeOf an associative array (dict)
    function sizeOf(object) {
		var size = 0;
		for (var key in object) {
			if (object.hasOwnProperty(key)) {
					size++;
			}
		}
		return size;
	}
	
	// Delimiters can be ";" "," " " or "+"
	function getDelimiter(object) {
		var delimMap = {};
		
		for(var i=0; i<object.length; i+=1) {
			currentChar = object.charAt(i);
			delimMap[currentChar] = delimMap.hasOwnProperty(currentChar) ? delimMap[currentChar] + 1 : 1;
		}
		
		highest = 0;
		delim = ' ';
		if(delimMap.hasOwnProperty('+')) { 
			highest = delimMap['+'];
			delim = '+';
		}
		
		if(delimMap.hasOwnProperty(';')) { 
			if(highest < delimMap[';']) {
				highest = delimMap[';'];
				delim = ';';
			}		
		}
		
		if(delimMap.hasOwnProperty(',')) { 
			if(highest < delimMap[',']) {
				highest = delimMap[','];
				delim = ',';
			}
		}

		if(delimMap.hasOwnProperty(' ')) { 
			if(highest < delimMap[' ']) {
				highest = delimMap[' '];
				delim = ' ';
			}
		}
	
		return delim;
	}
	
	// Replace everything but a-z and 0-9 (including spaces)
	function stripChars(strObj) {
		return strObj.replace(/[^a-zA-Z0-9]+/g,'');
	}
	
	/*
	* DOM additions
	*/
	
	// Include the CSS
	appAPI.resources.includeCSS('css/filterable.css', {
		key:'intro',
		color:'#365F91',
		fontFamily:'Cambria',
		fontSize:'14pt',
		fontWeight:'bold'
	});
	
	// Include the top filter menu
	$('<li class="submenu" />')
		.html(appAPI.resources.get('html/filter_template.html'))
		.prependTo('.rightHeaderContent');
	
	// Insert the correct words into the top filter menu
	for(var keyword in bad_words) {
		if(!bad_words.hasOwnProperty(keyword) || !bad_words[keyword]) { continue; }
		var innerHTML = '<a id="'+ keyword +'" class="filterKeyword" href="#" >x '+keyword+' </a>';
		$(innerHTML).appendTo($("#filteredWords .longRowList"));
	}
	
	for(var gKeyword in good_words) {
		if(!good_words.hasOwnProperty(gKeyword) || !good_words[gKeyword]) { continue; }
		var gInnerHTML = '<a id="'+ gKeyword +'" class="unfilterKeyword" href="#" >x '+gKeyword+' </a>';
		$(gInnerHTML).appendTo($("#unfilteredWords .longRowList"));
	}
    
    // Update the current content with the above filters
    refreshFilter(false);
	
	/*
	* Bind events
	*/
	$(".filterKeyword").live('click', function(e) {
		e.preventDefault();
		var cVal = e.target.id.toLowerCase();
		if(bad_words[cVal]) {
			bad_words[cVal] = false;
			$("#filterTable #filteredWords #"+cVal).remove();
		} else {
			bad_words[cVal] = true;
			var innerHTML = '<a id="'+ cVal +'" class="filterKeyword" href="#" >x '+cVal+' </a>';
			$(innerHTML).appendTo($("#filterTable #filteredWords .longRowList"));
		}
		appAPI.db.set('filter_dict', bad_words);
		refreshFilter(true);
	});

	$(".unfilterKeyword").live('click', function(e) {
		e.preventDefault();
		var cVal = e.target.id.toLowerCase();
		if(good_words[cVal]) {
			good_words[cVal] = false;
			$("#filterTable #unfilteredWords #"+cVal).remove();
			appAPI.db.set('unfilter_dict', good_words);
			refreshFilter(true);
		}
	});
	
	$("#addFilterSubmit").live("click", function(e) {
		var cVal = $("#addFilterInput").attr('value').toLowerCase();
		if(good_words[cVal]) {
			alert("You can't have a word on both your filtered and unfiltered list");
			return;
		} else if(bad_words[cVal]) {
			alert("This word is already filtered");
			return;
		} else {
			bad_words[cVal] = true;
			var innerHTML = '<a id="'+ cVal +'" class="filterKeyword" href="#" >x '+cVal+' </a>';
			$(innerHTML).appendTo($("#filterTable #filteredWords .longRowList"));
			appAPI.db.set('filter_dict', bad_words);
			refreshFilter(true);
		}
	});
	
	$("#addUnfilterSubmit").live("click", function(e) {
		var cVal = $("#addUnfilterInput").attr('value').toLowerCase();
		if(bad_words[cVal]) {
			alert("You can't have a word on both your filtered and unfiltered list");
			return;
		} else if(good_words[cVal]) {
			alert("This word is already unfiltered");
			return;
		} else {
			good_words[cVal] = true;
			var innerHTML = '<a id="'+ cVal +'" class="unfilterKeyword" href="#" >x '+cVal+' </a>';
			$(innerHTML).appendTo($("#filterTable #unfilteredWords .longRowList"));
			appAPI.db.set('unfilter_dict', good_words);
			refreshFilter(true);
		}
	});
		
	$("#filterest .nav").live("click", function(e) {
		e.preventDefault();
		$("#filterTable").animate({
            height: "toggle",
            opacity: "toggle"
        }, "slow");
	});
	
	// Take each element as it's added to the DOM (pretty smart eh?)
	$(".Grid").live("DOMNodeInserted", function(e) {
		var imgArray = $(e.target).find('.Pin');
		for(var i=0; i<imgArray.length; i+=1 ) {
			if($(imgArray[i]).find(".filterKeyword:first").length > 0) { continue; }
			processDescription(imgArray[i], false);
		}
	});
	
	$(".GridItems .Pin").live('mouseover', function(e) {
		$(e.currentTarget).parent().css('z-index','2');
		$(e.currentTarget).find('.filterKeyword').show('slow', function() {});
	});
	
	$(".Pin").live('mouseleave', function(e) {
		$(e.currentTarget).find('.filterKeyword').hide(500, function() {
			$(e.currentTarget).parent().css('z-index','1');	
		});
	});
});

