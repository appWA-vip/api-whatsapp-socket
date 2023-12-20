function presenceCheck(req, res, next) {
    const presence = req.query['presence']?.toString();
    const subscribe = req.query['subscribe']?.toString();
    const update = req.query['update']?.toString();

    if (!presence) {
        req.body.presence = false;
    } else {
        req.body.presence = !!(presence && presence === 'true');
    }

    if (!subscribe) {
        req.body.subscribe = 500;
    } else {
        req.body.subscribe = parseInt(subscribe);
        if (isNaN(req.body.subscribe)) {
            req.body.subscribe = 500;
        }
    }

    if (!update) {
        req.body.update = 2000;
    } else {
        req.body.update = parseInt(update);
        if (isNaN(req.body.update)) {
            req.body.update = 2000;
        }
    }

    next();
}

module.exports = presenceCheck;
