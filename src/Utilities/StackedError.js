function StackedError(e, src, notifyEmail) {
    var lines = src.split("\n");
    var getLine = function (number) {
        return truncate(':' + number + " >> " + lines[number].trim(), 150);
    };
    var accountId = AdWordsApp.currentAccount().getCustomerId();

    var stackFrames = ErrorStackParser.parse(e);

    var stringifiedStack = stackFrames.map(function (sf, i) {
        //var padding = i == 0 || i == stackFrames.length-2 ? 1 : 0;
        var lineNumber = sf.lineNumber - 1;

        return (sf.functionName ? sf.functionName + sf.fileName : sf.fileName) +
            (lines[lineNumber] ? getLine(lineNumber) : '')
    }).join('\n');

    if (!AdWordsApp.getExecutionInfo().isPreview() && notifyEmail) {
        Logger.sendEmail(
            notifyEmail,
            accountId + ' AdWords Script ' + e.message,
            e.message+"\n"+stringifiedStack,
            {noReply: true}  
        );
        Logger.log("Debug : Email sent to " + recipient);
    }

    this.message = e.message;
    this.name = e.name;

    Logger.log(stringifiedStack);
}

StackedError.prototype = Object.create(Error.prototype);
StackedError.prototype.constructor = StackedError;