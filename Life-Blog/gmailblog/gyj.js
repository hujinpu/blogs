/*
 * 解决ajax回退问题
 */
jQuery.extend({
	historyCurrentHash: undefined,
	
	historyCallback: undefined,
	
	historyInit: function(callback){
		jQuery.historyCallback = callback;
		var current_hash = location.hash;
		
		jQuery.historyCurrentHash = current_hash;
		if ((jQuery.browser.msie) && (jQuery.browser.version < 8)) {
			// To stop the callback firing twice during initilization if no hash present
			if (jQuery.historyCurrentHash == '') {
			jQuery.historyCurrentHash = '#';
		}
		
			// add hidden iframe for IE
			$("body").prepend('<iframe id="jQuery_history" style="display: none;"></iframe>');
			var ihistory = $("#jQuery_history")[0];
			var iframe = ihistory.contentWindow.document;
			iframe.open();
			iframe.close();
			iframe.location.hash = current_hash;
		}
		else if ($.browser.safari) {
			// etablish back/forward stacks
			jQuery.historyBackStack = [];
			jQuery.historyBackStack.length = history.length;
			jQuery.historyForwardStack = [];
			
			jQuery.isFirst = true;
		}
		jQuery.historyCallback(current_hash.replace(/^#/, ''));
		setInterval(jQuery.historyCheck, 100);
	},
	
	historyAddHistory: function(hash) {
		// This makes the looping function do something
		jQuery.historyBackStack.push(hash);
		
		jQuery.historyForwardStack.length = 0; // clear forwardStack (true click occured)
		this.isFirst = true;
	},
	
	historyCheck: function(){
		if ((jQuery.browser.msie) && (jQuery.browser.version < 8)) {
			// On IE, check for location.hash of iframe
			var ihistory = $("#jQuery_history")[0];
			var iframe = ihistory.contentDocument || ihistory.contentWindow.document;
			var current_hash = iframe.location.hash;
			if(current_hash != jQuery.historyCurrentHash) {
			
				location.hash = current_hash;
				jQuery.historyCurrentHash = current_hash;
				jQuery.historyCallback(current_hash.replace(/^#/, ''));
				
			}
		} else if ($.browser.safari) {
			if (!jQuery.dontCheck) {
				var historyDelta = history.length - jQuery.historyBackStack.length;
				
				if (historyDelta) { // back or forward button has been pushed
					jQuery.isFirst = false;
					if (historyDelta < 0) { // back button has been pushed
						// move items to forward stack
						for (var i = 0; i < Math.abs(historyDelta); i++) jQuery.historyForwardStack.unshift(jQuery.historyBackStack.pop());
					} else { // forward button has been pushed
						// move items to back stack
						for (var i = 0; i < historyDelta; i++) jQuery.historyBackStack.push(jQuery.historyForwardStack.shift());
					}
					var cachedHash = jQuery.historyBackStack[jQuery.historyBackStack.length - 1];
					if (cachedHash != undefined) {
						jQuery.historyCurrentHash = location.hash;
						jQuery.historyCallback(cachedHash);
					}
				} else if (jQuery.historyBackStack[jQuery.historyBackStack.length - 1] == undefined && !jQuery.isFirst) {
					// back button has been pushed to beginning and URL already pointed to hash (e.g. a bookmark)
					// document.URL doesn't change in Safari
					if (document.URL.indexOf('#') >= 0) {
						jQuery.historyCallback(document.URL.split('#')[1]);
					} else {
						var current_hash = location.hash;
						jQuery.historyCallback('');
					}
					jQuery.isFirst = true;
				}
			}
		} else {
			// otherwise, check for location.hash
			var current_hash = location.hash;
			if(current_hash != jQuery.historyCurrentHash) {
				jQuery.historyCurrentHash = current_hash;
				jQuery.historyCallback(current_hash.replace(/^#/, ''));
			}
		}
	},
	historyLoad: function(hash){
		var newhash;
		
		if (jQuery.browser.safari) {
			newhash = hash;
		}
		else {
			newhash = '#' + hash;
			location.hash = newhash;
		}
		jQuery.historyCurrentHash = newhash;
		
		if ((jQuery.browser.msie) && (jQuery.browser.version < 8)) {
			var ihistory = $("#jQuery_history")[0];
			var iframe = ihistory.contentWindow.document;
			iframe.open();
			iframe.close();
			iframe.location.hash = newhash;
			jQuery.historyCallback(hash);
		}
		else if (jQuery.browser.safari) {
			jQuery.dontCheck = true;
			// Manually keep track of the history values for Safari
			this.historyAddHistory(hash);
			
			// Wait a while before allowing checking so that Safari has time to update the "history" object
			// correctly (otherwise the check loop would detect a false change in hash).
			var fn = function() {jQuery.dontCheck = false;};
			window.setTimeout(fn, 200);
			jQuery.historyCallback(hash);
			// N.B. "location.hash=" must be the last line of code for Safari as execution stops afterwards.
			//      By explicitly using the "location.hash" command (instead of using a variable set to "location.hash") the
			//      URL in the browser and the "history" object are both updated correctly.
			location.hash = newhash;
		}
		else {
		  jQuery.historyCallback(hash);
		}
	}
});

$(function() {
    var $ctemp = $('#content-template');
    var contentTpObj = TrimPath.parseTemplate($ctemp.val());
    $ctemp.remove();

    var $stemp = $('#sidebar-template');
    var sidebarTpObj = TrimPath.parseTemplate($stemp.val());
    $stemp.remove();

    var $cmtemp = $('#comment-template');
    var commentTpObj = TrimPath.parseTemplate($cmtemp.val());
    $cmtemp.remove();

    //绑定搜索事件
    $('#search-form').submit(function(e) { //提交前做简单验证
        e.preventDefault();
        var txt = $('#search-text').val();
        if (txt) {
            $.getJSON('http://api.openresty.org/=/view/PostsSearch/~/~/?offset=0&count=5&query=' + txt + '&order_dir=desc&_user=hjp.Public&_callback=?', function(data) {
                var posts = data;
                $.getJSON('http://api.openresty.org/=/view/RowCountForSearch/~/~?query=' + txt + '&_user=hjp.Public&_callback=?', function(data) {
                    $('#content').remove();
                    $('#sidebar').before(contentTpObj.process({posts: posts, count: data[0].count, start: 1, end: 5}));
                    bindPagenavigator('/search-' + txt);
                    bindEntryCategory();
                });
            });
        }
    });

    //第一次加载文章
    function initPosts() {
        $.getJSON('http://api.openresty.org/=/model/Posts/~/~/?_count=5&_order_by=id%3Adesc&_offset=0&_user=hjp.Public&_callback=?', function(data) {
            var posts = data;
            $.getJSON('http://api.openresty.org/=/view/RowCount/model/Posts/?_user=hjp.Public&_callback=?', function(data) {
                $('#footer').before(contentTpObj.process({posts: posts, count: data[0].count, start: 1, end: 5}));

                bindPagenavigator('/ppage');
                bindEntryCategory();

                //加载侧边栏
                $.getJSON('http://api.openresty.org/=/model/Catalogs/~/~/?_user=hjp.Public&_callback=?', function(data) {
                    $('#footer').before(sidebarTpObj.process({catalogs: data}));
                    $('#sidebar>h2').click(function() {
                        $(this).toggleClass('collapse').next().toggle();
                    });
                    $('#catalogs li a').click(function() {
                        $.historyLoad('/' + this.href.substring(this.href.indexOf('#catalog-') + 1));
                        return false;
                    });
                });

                //绑定事件
                $('#content div.entry-title h3 a').live('click', function() {
                    $.historyLoad('/' + this.href.substring(this.href.indexOf('#post-') + 1));
                    return false;
                });
            });
        });
    }

    //绑定类别链接点击事件
    function bindEntryCategory() {
        $('#content span.entry-category a').click(function() {
            $.historyLoad('/' + this.href.substring(this.href.indexOf('#catalog-') + 1));
            return false;
        });
    }

    //加载单篇文章
    function getPostById(pid) {
        var _thisFunc = arguments.callee;
        $.getJSON('http://api.openresty.org/=/model/Posts/id/' + pid + '/?_user=hjp.Public&_callback=?', function(data) {
            var post = data[0];
            $.getJSON('http://api.openresty.org/=/model/Comments/pid/' + pid + '/?_user=hjp.Public&_callback=?', function(data) {
                $('#content').html('').append(commentTpObj.process({p: post, comments: data}));

                bindEntryCategory();

                $('#content div.pagenavigator span a.goback').click(function() {
                    history.go(-1);
                    return false;
                });

                $('#comment-form').submit(function(e) { //提交前做简单验证
                    e.preventDefault();
                    var flag = true;
                    var emailP = /^([a-zA-Z0-9._-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/;
                    if ($('#author', this).val() == '') {
                        $('label[for="author"]', this).addClass('warning');
                        flag = false;
                    }
                    if (!emailP.test($('#email', this).val())) {
                        $('label[for="email"]', this).addClass('warning');
                        flag = false;
                    }
                    if ($('#comment', this).val() == '') {
                        alert('啥都不说，没劲。');
                        flag = false;
                    }
                    if (flag) { //提交表单
                        $.ajax({
                            type: 'GET',
                            url: 'http://api.openresty.org/=/action/PostAComment/~/~/?_user=hjp.Public&_callback=?',
                            dataType: 'jsonp',
                            data: {
                                author: $('#author').val(),
                                email: $('#email').val(),
                                website: $('#url').val(),
                                content: $('#comment').val(),
                                pid: pid
                            },
                            success: function(data, textStatus) {
                                _thisFunc.call(this, pid);
                            }
                        });
                        
                    }
                });
            });
        });
    }

    //得到页面
    function getSpecialPage(hash) {
        if (hash.indexOf('post') != -1) {

            getPostById(hash.substring(hash.indexOf('-') + 1)); 

        } else if (hash.indexOf('catalog') != -1 && hash.lastIndexOf('cpage') == -1) { //类别

            $.getJSON('http://api.openresty.org/=/model/Posts/catalog/' + hash.substring(hash.indexOf('-') + 1) + '/?_count=5&_order_by=id%3Adesc&_offset=0&_user=hjp.Public&_callback=?', function(data) {
                var posts = data;
                $.getJSON('http://api.openresty.org/=/model/Catalogs/name/' + hash.substring(hash.indexOf('-') + 1) + '/?_user=hjp.Public&_callback=?', function(data) {
                    $('#content').remove();
                    $('#sidebar').before(contentTpObj.process({posts: posts, count: data[0].posts, start: 1, end: 5}));
                    bindPagenavigator(hash + '/cpage');
                    bindEntryCategory();
                });
            });
        } else if (hash.indexOf('ppage') != -1) { //日志分页

            var start = hash[hash.indexOf('-') - 1];
            var end = hash[hash.indexOf('-') + 1];
            $.getJSON('http://api.openresty.org/=/model/Posts/~/~/?_count=5&_order_by=id%3Adesc&_offset=' + (Number(start)-1) + '&_user=hjp.Public&_callback=?', function(data) {
                if ($('#count').length) {
                    var count = $('#count').text();
                    $('#content').remove();
                    $('#sidebar').before(contentTpObj.process({posts: data, count: count, start: start, end: end}));
                    bindPagenavigator('/ppage');
                    bindEntryCategory();
                } else {
                    var posts = data;
                    $.getJSON('http://api.openresty.org/=/view/RowCount/model/Posts/?_user=hjp.Public&_callback=?', function(data) {
                        $('#content').remove();
                        $('#sidebar').before(contentTpObj.process({posts: posts, count: data[0].count, start: start, end: end}));
                        bindPagenavigator('/ppage');
                        bindEntryCategory();
                    });
                }
            });

        } else if (hash.indexOf('cpage') != -1) { //类别分页

            var start = hash[hash.lastIndexOf('-') - 1];
            var end = hash[hash.lastIndexOf('-') + 1];
            $.getJSON('http://api.openresty.org/=/model/Posts/catalog/' + hash.substring(hash.indexOf('-') + 1, hash.indexOf('/cpage')) + '/?_count=5&_order_by=id%3Adesc&_offset=' + (Number(start)-1) + '&_user=hjp.Public&_callback=?', function(data) {
                if ($('#count').length) {
                    var count = $('#count').text();
                    $('#content').remove();
                    $('#sidebar').before(contentTpObj.process({posts: data, count: count, start: start, end: end}));
                    bindPagenavigator(hash.substring(0, hash.lastIndexOf('/')));
                    bindEntryCategory();
                } else {
                    $.getJSON('http://api.openresty.org/=/model/Posts/catalog/' + hash.substring(hash.indexOf('-') + 1, hash.indexOf('/cpage')) + '/?_count=5&_order_by=id%3Adesc&_offset=' + (Number(start)-1) + '&_user=hjp.Public&_callback=?', function(data) {
                        var posts = data;
                        $.getJSON('http://api.openresty.org/=/model/Catalogs/name/' + hash.substring(hash.indexOf('-') + 1, hash.indexOf('/cpage')) + '/?_user=hjp.Public&_callback=?', function(data) {
                            $('#content').remove();
                            $('#sidebar').before(contentTpObj.process({posts: posts, count: data[0].posts, start: start, end: end}));
                            bindPagenavigator(hash.substring(0, hash.lastIndexOf('/')));
                            bindEntryCategory();
                        });
                    });
                }
            });

        } else if (hash.indexOf('search-') != -1) { //搜索分页

            var start = hash[hash.lastIndexOf('-') - 1];
            var end = hash[hash.lastIndexOf('-') + 1];
            var txt = $('#search-text').val();
            $.getJSON('http://api.openresty.org/=/view/PostsSearch/~/~/?offset=' + (Number(start)-1) + '&count=5&query=' + txt + '&order_dir=desc&_user=hjp.Public&_callback=?', function(data) {

                if ($('#count').length) {
                    var count = $('#count').text();
                    $('#content').remove();
                    $('#sidebar').before(contentTpObj.process({posts: data, count: count, start: start, end: end}));
                    bindPagenavigator('/search-' + txt);
                    bindEntryCategory();
                } else {
                    var posts = data;
                    $.getJSON('http://api.openresty.org/=/view/RowCountForSearch/~/~?query=' + txt + '&_user=hjp.Public&_callback=?', function(data) {
                        $('#content').remove();
                        $('#sidebar').before(contentTpObj.process({posts: posts, count: data[0].count, start: start, end: end}));
                        bindPagenavigator('/search-' + txt);
                        bindEntryCategory();
                    });
                }
            });
        
        }
    }

    //绑定分页
    function bindPagenavigator(pre) {
        $('#content div.pagenavigator span a').click(function() {
            var spanIn = $('#content div.pagenavigator span')[0].innerHTML;
            if (this.href.indexOf('newer') != -1) {
                var pageNum = Number(spanIn[spanIn.indexOf('-') - 2]);
                $.historyLoad(pre + '/' + (pageNum-5) + '-' + (pageNum-1));
            } else if (this.href.indexOf('older') != -1 ) {
                var pageNum = Number(spanIn[spanIn.indexOf('-') - 2]);
                var count = $('#count').text();
                $.historyLoad(pre + '/' + (pageNum+5) + '-' + (pageNum+9 < count ? pageNum+9 : count));
            }
            return false;
        });
    }

    //根据hash加载页面
    function hackHistory(hash) {
        if (hash) {
            if (hash == '/') {
                if ($('#content').length) {
                    $.getJSON('http://api.openresty.org/=/model/Posts/~/~/?_count=5&_order_by=id%3Adesc&_offset=0&_user=hjp.Public&_callback=?', function(data) {
                        var posts = data;
                        $.getJSON('http://api.openresty.org/=/view/RowCount/model/Posts/?_user=hjp.Public&_callback=?', function(data) {
                            $('#content').remove();
                            $('#sidebar').before(contentTpObj.process({posts: posts, count: data[0].count, start:1, end: 5}));
                            bindPagenavigator('/ppage');
                        });
                    });
                } else {
                    initPosts();
                }
            } else {
                if ($('#content').length) {
                    getSpecialPage(hash);
                } else {
                    $('#footer').before('<div id="content" />');
                    //加载侧边栏
                    $.getJSON('http://api.openresty.org/=/model/Catalogs/~/~/?_user=hjp.Public&_callback=?', function(data) {
                        $('#footer').before(sidebarTpObj.process({catalogs: data}));
                        $('#sidebar>h2').click(function() {
                            $(this).toggleClass('collapse').next().toggle();
                        });
                        $('#catalogs li a').click(function() {
                            $.historyLoad('/' + this.href.substring(this.href.indexOf('#catalog-') + 1));
                            return false;
                        });
                        getSpecialPage(hash);
                    });
                }
            }
        } else { //没有hash的情况
            $.historyLoad('/') 
        }
    }

    $.historyInit(hackHistory); //ajax回退功能初始化

});
