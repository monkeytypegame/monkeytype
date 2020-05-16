function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

let commands = {
    title: "",
    list: [
        {
            id: "togglePunctuation",
            display: "Toggle punctuation",
            exec: () => {
                togglePunctuation();
                restartTest();
            }
        },
        {
            id: "toggleSmoothCaret",
            display: "Toggle smooth caret",
            exec: () => {
                toggleSmoothCaret();
            }
        },
        {
            id: "toggleQuickTab",
            display: "Toggle quick tab mode",
            exec: () => {
                toggleQuickTabMode();
            }
        },
        {
            id: "toggleShowLiveWpm",
            display: "Toggle live wpm display",
            exec: () => {
                config.showLiveWpm = !config.showLiveWpm;
                saveConfigToCookie();
            }
        },
        {
            id: "toggleKeyTips",
            display: "Toggle keybind tips",
            exec: () => {
                toggleKeyTips();
            }
        },
        {
            id: "changeTheme",
            display: "Change theme...",
            subgroup: true,
            exec: () => {
                currentCommands = commandsThemes;
                showCommandLine();
            }
        },
        {
            id: "changeMode",
            display: "Change mode...",
            subgroup: true,
            exec: () => {
                currentCommands = commandsMode;
                showCommandLine();
            }
        },
        {
            id: "changeTimeConfig",
            display: "Change time config...",
            subgroup: true,
            exec: () => {
                currentCommands = commandsTimeConfig;
                showCommandLine();
            }
        },
        {
            id: "changeWordCount",
            display: "Change word count...",
            subgroup: true,
            exec: () => {
                currentCommands = commandsWordCount;
                showCommandLine();
            }
        },
        {
            id: "sendDevMessage",
            display: "Send a message ( bug report / feature request / feedback )...",
            subgroup: true,
            exec: () => {
                currentCommands = commandsSendDevMessage;
                showCommandLine();
            }
        }
    ]
};

let commandsSendDevMessage = {
    title: "Send a message...",
    list: [
        {
            id: "sendBugReport",
            display: "Bug report",
            input: true,
            exec: (txt) => {
                db_addEmailToQueue('bug', txt);
            }
        },
        {
            id: "sendFeatureRequest",
            display: "Feature request",
            input: true,
            exec: (txt) => {
                db_addEmailToQueue('feature', txt);
            }
        },
        {
            id: "sendFeedback",
            display: "Other feedback",
            input: true,
            exec: (txt) => {
                db_addEmailToQueue('feedback', txt);
            }
        }
    ]
}


let commandsWordCount = {
    title: "Change word count...",
    list: [
        {
            id: "changeWordCount10",
            display: "10",
            exec: () => {
                changeWordCount("10");
                restartTest();
            }
        },
        {
            id: "changeWordCount25",
            display: "25",
            exec: () => {
                changeWordCount("25");
                restartTest();
            }
        },
        {
            id: "changeWordCount50",
            display: "50",
            exec: () => {
                changeWordCount("50");
                restartTest();
            }
        },
        {
            id: "changeWordCount100",
            display: "100",
            exec: () => {
                changeWordCount("100");
                restartTest();
            }
        },
        {
            id: "changeWordCount200",
            display: "200",
            exec: () => {
                changeWordCount("200");
                restartTest();
            }
        }
    ]
};
let commandsMode = {
    title: "Change mode...",
    list: [
        {
            id: "changeModeTime",
            display: "time",
            exec: () => {
                changeMode("time");
                restartTest();
            }
        },
        {
            id: "changeModeWords",
            display: "words",
            exec: () => {
                changeMode("words");
                restartTest();
            }
        },
        {
            id: "changeModeCustom",
            display: "custom",
            exec: () => {
                changeMode("custom");
                restartTest();
            }
        }
    ]
};
let commandsTimeConfig = {
    title: "Change time config...",
    list: [
        {
            id: "changeTimeConfig15",
            display: "15",
            exec: () => {
                changeTimeConfig("15");
                restartTest();
            }
        },
        {
            id: "changeTimeConfig30",
            display: "30",
            exec: () => {
                changeTimeConfig("30");
                restartTest();
            }
        },
        {
            id: "changeTimeConfig60",
            display: "60",
            exec: () => {
                changeTimeConfig("60");
                restartTest();
            }
        },
        {
            id: "changeTimeConfig120",
            display: "120",
            exec: () => {
                changeTimeConfig("120");
                restartTest();
            }
        }
    ]
};

let themesList;

$.getJSON("themes/list.json", function(data) {
    commandsThemes.list = [];
    themesList = data.sort();
    data.forEach(theme => {
        commandsThemes.list.push({
            id: "changeTheme" + capitalizeFirstLetter(theme),
            display: theme.replace('_',' '),
            hover: () => {
                previewTheme(theme);
            },
            exec: () => {
                setTheme(theme);
                saveConfigToCookie();
            }
        })
    })
});

let commandsThemes = {
    title: "Change theme...",
    list: [
        {
            id: "couldnotload",
            display: "Could not load the themes list :("
        }
    ]
};

$("#commandLine input").keyup((e) => {
    if (e.keyCode == 38 || e.keyCode == 40) return;
    updateSuggestedCommands();
});

$(document).ready(e => {
    $(document).keydown((event) => {
        //escape
        if (event.keyCode == 27) {
            if ($("#commandLineWrapper").hasClass("hidden")) {
                currentCommands = commands;
                showCommandLine();
            } else {
                hideCommandLine();
                setTheme(config.theme);
            }
        }
    })
})

$("#commandInput textarea").keydown((e) => {
    if (e.keyCode == 13 && e.shiftKey) {
        //enter
        e.preventDefault();
        let command = $("#commandInput textarea").attr("command");
        let value = $("#commandInput textarea").val();
        $.each(currentCommands.list, (i, obj) => {
            if (obj.id == command) {
                obj.exec(value);
                subgroup = obj.subgroup;
            }
        });
        firebase.analytics().logEvent('usedCommandLine', {
            command: command
        });
        hideCommandLine();
    }
    return;
});

$("#commandLine input").keydown((e) => {
    if (e.keyCode == 13) {
        //enter
        e.preventDefault();
        let command = $(".suggestions .entry.active").attr("command");
        let subgroup = false;
        let input = false;
        $.each(currentCommands.list, (i, obj) => {
            if (obj.id == command) {
                if (obj.input) {
                    input = true;
                    showCommandInput(obj.id, obj.display);
                } else {
                    obj.exec();
                    subgroup = obj.subgroup;
                }
            }
        });
        if (!subgroup && !input) {
            firebase.analytics().logEvent('usedCommandLine', {
                command: command
            });
            hideCommandLine();
        }
        return;
    }
    if (e.keyCode == 38 || e.keyCode == 40) {
        //up
        let entries = $(".suggestions .entry");
        let activenum = -1;
        let hoverId;
        $.each(entries, (index, obj) => {
            if ($(obj).hasClass("active")) activenum = index;
        });
        if (e.keyCode == 38) {
            entries.removeClass("active");
            if (activenum == 0) {
                $(entries[entries.length - 1]).addClass("active");
                hoverId = $(entries[entries.length - 1]).attr('command');
            } else {
                $(entries[--activenum]).addClass("active");
                hoverId = $(entries[activenum]).attr('command');
            }
        }
        if (e.keyCode == 40) {
            entries.removeClass("active");
            if (activenum + 1 == entries.length) {
                $(entries[0]).addClass("active");
                hoverId = $(entries[0]).attr('command');
            } else {
                $(entries[++activenum]).addClass("active");
                hoverId = $(entries[activenum]).attr('command');
            }
        }
        try {
            $.each(currentCommands.list, (index, obj) => {
                if (obj.id == hoverId) {
                    obj.hover();
                }
            });
        } catch (e) { }

        return false;
    }
});



function hideCommandLine() {
    $("#commandLineWrapper")
        .stop(true, true)
        .css("opacity", 1)
        .animate(
            {
                opacity: 0
            },
            100,
            () => {
                $("#commandLineWrapper").addClass("hidden");
            }
        );
    focusWords();
}

function showCommandLine() {
    $("#commandLine").removeClass('hidden');
    $("#commandInput").addClass('hidden');
    if ($("#commandLineWrapper").hasClass("hidden")) {
        $("#commandLineWrapper")
            .stop(true, true)
            .css("opacity", 0)
            .removeClass("hidden")
            .animate(
                {
                    opacity: 1
                },
                100
            );
    }
    $("#commandLine input").val("");
    updateSuggestedCommands();
    $("#commandLine input").focus();
}

function showCommandInput(command, placeholder) {
    $("#commandLineWrapper").removeClass('hidden');
    $("#commandLine").addClass('hidden');
    $("#commandInput").removeClass('hidden');
    $("#commandInput textarea").attr('placeholder', placeholder);
    $("#commandInput textarea").val('');
    $("#commandInput textarea").focus();
    $("#commandInput textarea").attr('command', '');
    $("#commandInput textarea").attr('command', command);
}

function updateSuggestedCommands() {
    let inputVal = $("#commandLine input").val().toLowerCase().split(" ");
    if (inputVal[0] == "") {
        $.each(currentCommands.list, (index, obj) => {
            obj.found = true;
        });
    } else {
        $.each(currentCommands.list, (index, obj) => {
            let foundcount = 0;
            $.each(inputVal, (index2, obj2) => {
                if (obj2 == "") return;
                let re = new RegExp("\\b"+obj2, "g");
                let res = obj.display.toLowerCase().match(re);
                if (res != null && res.length > 0) {
                    foundcount++;
                } else {
                    foundcount--;
                }
            });
            if (foundcount > 0) {
                obj.found = true;
            } else {
                obj.found = false;
            }
        });
    }
    displayFoundCommands();
}

function displayFoundCommands() {
    $("#commandLine .suggestions").empty();
    $.each(currentCommands.list, (index, obj) => {
        if (obj.found) {
            $("#commandLine .suggestions").append(
                '<div class="entry" command="' + obj.id + '">' + obj.display + "</div>"
            );
        }
    });
    if ($("#commandLine .suggestions .entry").length == 0) {
        $("#commandLine .separator").css({ height: 0, margin: 0 });
    } else {
        $("#commandLine .separator").css({
            height: "1px",
            "margin-bottom": ".5rem"
        });
    }
    let entries = $("#commandLine .suggestions .entry");
    if (entries.length > 0) {
        $(entries[0]).addClass("active");
        try{
            $.each(currentCommands.list, (index, obj) => {
                if (obj.found) {
                    obj.hover();
                    return false;
                }
            });
        }catch(e){}
    }
    $("#commandLine .listTitle").remove();
    // if(currentCommands.title != ''){
    //   $("#commandLine .suggestions").before("<div class='listTitle'>"+currentCommands.title+"</div>");
    // }
}
