/**
 * @param {number} value
 */
export function ram(value) {
    return `${value}GB`;
}

/**
 * @param {number} value
 */
export function money(value) {
    let dollars = Math.floor(value);
    return `\$${dollars.toLocaleString()}`;
}

/**
 * @param {number} value
 */
export function time(value) {
    let seconds = Math.floor(value);

    if (seconds > 60) {
        let minutes = Math.floor(seconds / 60);
        seconds = seconds - minutes*60;
        if (minutes > 60) {
            let hours = Math.floor(minutes / 60);
            minutes = minutes - hours*60;
            return `${hours}h ${minutes}m ${seconds}s`;
        } else {
            return `${minutes}m ${seconds}s`;
        }
    } else {
        return `${seconds}s`;
    }
}