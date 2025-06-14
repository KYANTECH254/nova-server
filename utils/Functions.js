function validateDdnsHost(host) {
    if (typeof host !== 'string' || host.trim() === '') return false;

    const ddnsRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return ddnsRegex.test(host.trim());
}

function isValidIP(ip) {
    const ipv4 =
        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

    const ipv6 =
        /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;

    return ipv4.test(ip) || ipv6.test(ip);
}

module.exports = { isValidIP, validateDdnsHost }