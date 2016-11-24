var global = this;

(function () {
    var newLine = "\r\n";

    var textToHtml = function (str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
    };

    var arrToString = function (stringArr) {
        var msgs = '';
        _.each(stringArr, function (msg) {
            msgs += msg + newLine;
        });
        return msgs;
    };

    global.Mailer = LoggableClass.extend({
        subject: "",
        options: {
            name: "AdWords Script Bot",
            htmlBody: ""
        },
        body: null,

        init: function (subject, content, options) {
            this.options = _.extend(this.options, _.isObject(options) ? options : {});

            this.subject = subject;

            if (content)
                this.pushBody(content).pushBody(content, 'html');
        },
        send: function (recipient) {
            if (this.options.logo)
                this.prependBody(
                    "<img width='150' src='" + this.options.logo + "' style='float:left'>" + newLine + newLine,
                    'html'
                );

            if (this.options.footer)
                this.pushBody(newLine + newLine + this.options.footer, 'html');

            return MailApp.sendEmail(recipient, this.subject, this.body, _.omit(this.options, ['logo', 'footer']));
        },
        pushBody: function (content, isHtml) {
            return this.alterBody.apply(this,[content, isHtml, "push"]);
        },
        prependBody: function (content, isHtml) {
            return this.alterBody.apply(this,[content, isHtml, "prepend"]);
        },
        alterBody: function (content, isHtml, action) {
            _.isArray(content) && (content = arrToString(content));
            isHtml = !!isHtml;

            if(isHtml) {
                if(action == "push")
                    this.options.htmlBody += textToHtml(content);
                else
                    this.options.htmlBody = textToHtml(content) + this.options.htmlBody;
            }
            else {
                if(action == "push")
                    this.body += content;
                else
                    this.body = content + this.body;
            }

            return this;
        }
    });
})();