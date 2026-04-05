/**
 * Udleder initialer fra et fuldt navn (max 3 tegn).
 * Eksempel: "Michael Guldbæk Nielsen" -> "MGN"
 * @param {string} name 
 * @returns {string}
 */
function getInitials(name) {
    if (!name) return "JAA";
    return name
        .split(/[\s_-]+/)
        .filter(x => x.length > 0)
        .map(x => x[0])
        .join('')
        .toUpperCase()
        .substring(0, 3);
}

module.exports = getInitials;
