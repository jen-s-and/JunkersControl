function _(el) {
    return document.getElementById(el);
}

const ThemeStorageKey = "cerasmarter-theme";

function ensureThemeStyles() {
    if (_("cerasmarter-theme-styles")) return;
    const style = document.createElement("style");
    style.id = "cerasmarter-theme-styles";
    style.textContent = `body{transition:background-color .18s ease,color .18s ease}body.theme-light{background:#f6f8fb;color:#212529}body.theme-dark{background:#111827;color:#e5e7eb}body.theme-dark .navbar,body.theme-dark .dropdown-menu{background-color:#0b1220!important;border-color:#263244}body.theme-dark .dropdown-item,body.theme-dark .navbar-brand,body.theme-dark .nav-link{color:#e5e7eb!important}body.theme-dark .dropdown-item:hover,body.theme-dark .dropdown-item:focus{background-color:#1f2937}body.theme-dark .card,body.theme-dark .list-group-item,body.theme-dark .modal-content,body.theme-dark .border,body.theme-dark .alert-light{background-color:#172033!important;border-color:#2f3d52!important;color:#e5e7eb!important}body.theme-dark .table{color:#e5e7eb;border-color:#2f3d52}body.theme-dark .table>:not(caption)>*>*{background-color:#172033;border-color:#2f3d52;color:#e5e7eb}body.theme-dark .table-warning>*{background-color:#574111!important;color:#fff4cf!important}body.theme-dark .table-info>*{background-color:#113b54!important;color:#d7f1ff!important}body.theme-dark .bg-light,body.theme-dark .sticky-top.bg-light{background-color:#1f2937!important;color:#f3f4f6!important}body.theme-dark .form-control,body.theme-dark .form-select{background-color:#0f172a;border-color:#334155;color:#e5e7eb}body.theme-dark .text-muted,body.theme-dark .form-text{color:#a7b3c4!important}body.theme-dark code{color:#a7f3d0}.theme-toggle-label{min-width:3.2rem;color:#e5e7eb}`;
    document.head.appendChild(style);
}

function getStoredTheme() {
    const stored = localStorage.getItem(ThemeStorageKey);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
    ensureThemeStyles();
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme !== "dark");
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = _("theme-toggle");
    const label = _("theme-toggle-label");
    if (toggle) toggle.checked = theme === "dark";
    if (label) label.textContent = theme === "dark" ? "Dark" : "Light";
}

function setTheme(theme) {
    localStorage.setItem(ThemeStorageKey, theme);
    applyTheme(theme);
}

function initThemeToggle() {
    const toggle = _("theme-toggle");
    if (!toggle) return;
    toggle.checked = getStoredTheme() === "dark";
    toggle.addEventListener("change", function () { setTheme(toggle.checked ? "dark" : "light"); });
    applyTheme(getStoredTheme());
}

if (document.body) applyTheme(getStoredTheme());
const CanErrorCodes = [
    "OK",
    "No MCP2515",
    "Too Far From Desired Bit Rate",
    "Inconsistent Bit Rate Settings",
    "INT Pin Is Not An Interrupt",
    "ISR Is Null",
    "Requested Mode TimeOut",
    "Acceptance Filter Array Is NULL",
    "One Filter Mask Requires One Or Two Acceptance Filters",
    "Two Filter Masks Require Three To Six Acceptance Filters",
    "Cannot Allocate Receive Buffer",
    "Cannot Allocate Transmit Buffer 0",
    "Cannot Allocate Transmit Buffer 1",
    "Cannot Allocate Transmit Buffer 2",
    "ISR Not Null And No Int Pin",
]

function humanReadableSize(bytes) {
    if (bytes < 1024)
        return bytes + " B";
    else if (bytes < (1024 * 1024))
        return (bytes / 1024.0).toFixed(2) + " KB";
    else if (bytes < (1024 * 1024 * 1024))
        return (bytes / 1024.0 / 1024.0).toFixed(2) + " MB";
    else
        return (bytes / 1024.0 / 1024.0 / 1024.0).toFixed(2) + " GB";
}

function loadNavigation() {
    const nav = _("navigation-container");
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            nav.innerHTML = xhr.responseText;
            let curLocation = window.location.pathname
                .replace("/", "")
                .trim();
            if (curLocation.length === 0) {
                curLocation = "home";
            }
            try {
                _(curLocation + "-link").classList.add("active");
            } catch (error) {
                console.log("Missing Nav-link to activate.");
            }
            initThemeToggle();
        }
    }

    xhr.open("GET", "frontend/navigation.html", true);
    xhr.setRequestHeader('Content-type', 'text/html');
    xhr.send();
}

/**
 * Gets all keys of a json object
 * 
 * @param {Object} jsonObj Input json to look through
 * @returns {Array<string>} An array of point separated keys as string
 */
function getDeepKeys(jsonObj) {
    let keys = [];
    for (var key in jsonObj) {
        if (typeof jsonObj[key] === "object" && !Array.isArray(jsonObj[key])) {
            var subkeys = getDeepKeys(jsonObj[key]);
            keys = keys.concat(subkeys.map(function (subkey) {
                return `${key}.${subkey}`;
            }));
        } else if (Array.isArray(jsonObj[key])) {
            for (var i = 0; i < jsonObj[key].length; i++) {
                var subkeys = getDeepKeys(jsonObj[key][i]);
                keys = keys.concat(subkeys.map((subkey) => `${key}[${i}].${subkey}`));
            }
        } else {
            keys.push(key);
        }
    }
    return keys;
}

/**
* Converts a string path to a value that is existing in a json object.
* 
* @param {Object} jsonObj Json to use for searching the value.
* @param {Object} path the path to use to find the value.
* @returns {valueOfThePath|null}
*/
function jsonPathToValue(jsonObj, path) {
    if (!(jsonObj instanceof Object) || typeof (path) === "undefined") {
        throw `Not valid argument:jsonData:${jsonObj}, path:${path}`;
    }
    path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    path = path.replace(/^\./, ''); // strip a leading dot
    const pathArray = path.split('.');
    for (let i = 0, n = pathArray.length; i < n; ++i) {
        const key = pathArray[i];
        if (key in jsonObj) {
            if (jsonObj[key] !== null) {
                jsonObj = jsonObj[key];
            } else {
                return null;
            }
        } else {
            return key;
        }
    }
    return jsonObj;
}

/**
 * Converts a form into a nested json object. Form input fields need to have a 'name' attribute and nested values need to have a dot-separated name.
 * Example:
 * ```
 * <form>
 *  <input name="parent.subkey1"/>
 *  <input name="parent.subkey2.subkey3"/>
 * </form>
 * ```
 * @param {string} formId The Id of the form to process
 * @returns {Object} A json object containing the forms data
 */
function serializeForm(formId) {
    const elements = document.querySelectorAll(`#${formId} input`);
    const data = {};
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        var val = el.value;
        if (!val) val = "";
        const fullName = el.getAttribute("name");
        if (!fullName) continue;
        const fullNameParts = fullName.split('.');
        let prefix = '';
        let stack = data;
        for (let k = 0; k < fullNameParts.length - 1; k++) {
            prefix = fullNameParts[k];
            if (!stack[prefix]) {
                stack[prefix] = {};
            }
            stack = stack[prefix];
        }
        prefix = fullNameParts[fullNameParts.length - 1];
        if (stack[prefix]) {

            var newVal = `${stack[prefix]},${val}`;
            stack[prefix] += newVal;
        } else {
            stack[prefix] = val;
        }
    }
    return data;
}

function rebootButton() {
    _("statusdetails").innerHTML = "Invoking Reboot ...";
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/reboot", true);
    xhr.send();
    window.open("/reboot", "_self");
}