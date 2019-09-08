const authApiBasePath = "https://ommkdunauc.execute-api.eu-central-1.amazonaws.com/dev";
const categoriesApiBasePath = "https://g8335hfcy0.execute-api.eu-central-1.amazonaws.com/dev";
const locationsApiBasePath = "https://6mo2qzbcag.execute-api.eu-central-1.amazonaws.com/dev"
const reviewsApiBasePath = "https://2nhq1hidx6.execute-api.eu-central-1.amazonaws.com/dev";
const quotesApiBasePath = "https://z75j3glj94.execute-api.eu-central-1.amazonaws.com/dev";

//#region Authentication

function getBearerToken(redirectToLogin) {
    let token = Cookies.getJSON("idToken") ? Cookies.getJSON("idToken").jwtToken : undefined;
    if (!token && redirectToLogin) {
        $(location).attr("href", "login.html");
        return;
    }
    return token;
}

function setTokens(tokens) {
    Cookies.set("accessToken", tokens.accessToken, { expires: new Date(tokens.accessToken.payload.exp * 1000) });
    Cookies.set("clockDrift", tokens.clockDrift);
    Cookies.set("idToken", tokens.idToken, { expires: new Date(tokens.idToken.payload.exp * 1000) });
    Cookies.set("refreshToken", tokens.refreshToken);
}

function getIdToken() {
    return Cookies.getJSON("idToken") || undefined;
}

function getAccessToken() {
    return Cookies.getJSON("accessToken") || undefined;
}

function getRefreshToken() {
    return Cookies.getJSON("refreshToken") || undefined;
}

async function login() {
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/auth`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            username: $("#loginemail").val(),
            password: $("#loginpassword").val()
        })
    })
        .done(async (data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /auth", data, textStatus, jqXHR);
            setTokens(data);
            return data;
        });
}

async function registerUser() {
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/register`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            email: $("#registeremail").val(),
            password: $("#password").val(),
            firstName: $("#firstName").val(),
            lastName: $("#lastName").val()
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /register", data, textStatus, jqXHR);
            return data;
        });
}

async function confirmRegistrationCode(username, code) {
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/confirmRegistrationCode`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            username: username,
            code: code
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /confirmRegistrationCode", data, textStatus, jqXHR);
            return data;
        });
}

async function resendCode(username) {
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/resendCode`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            username: username
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /resendCode", data, textStatus, jqXHR);
            return data;
        });
}

async function recoverPassword(emailAddress) {
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/forgotPassword`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            emailAddress: emailAddress
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /forgotPassword", data, textStatus, jqXHR);
            return data;
        });
}

async function confirmPassword(emailAddress, verificationCode, newPassword) {
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/confirmPassword`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            emailAddress: emailAddress,
            verificationCode: verificationCode,
            newPassword: newPassword
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /confirmPassword", data, textStatus, jqXHR);
            return data;
        });
}

async function isLoggedIn(redirectToLogin) {

    // Check if token is still valid
    var token = getBearerToken(redirectToLogin);
    if (!token) {
        $("#signin").append(`
            <a class="btn btn-info" href="login.html">Sign In</a>
        `);
        return false;
    }
    //$("signin").empty();
    console.log("Verifying token:", token);
    return await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/verifyToken`,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            token: token
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /verifyToken", data, textStatus, jqXHR);

            $("#signin").append(`
            <nav class="site-navigation float-left">                             
                <div class="container">
                    <ul class="site-menu js-clone-nav d-none d-lg-block">
                        <li class="has-children">
                            <a href="#">${data.given_name ? data.given_name : data.email}</a>
                            <ul class="dropdown">
                                <li><a href="user-profile.html">Profile</a></li>
                                <li><a href="requests.html">Requests</a></li>
                                <li><a href="#" onclick="logout()">Logout</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>
            `);

            $("#businesses").hide();
            return true;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(null, jqXHR, textStatus, errorThrown);
            $("#signin").append(`
            <a class="btn btn-info" href="login.html">Sign In</a>
            `);
            return false;
        });
}

async function refreshToken() {
    await $.ajax({
        method: "POST",
        url: `${authApiBasePath}/refreshToken`,
        beforeSend: getHeaders,
        data: JSON.stringify({
            refreshToken: getRefreshToken(),
            idToken: getIdToken(),
            accessToken: getAccessToken()
        }),
        dataType: "json"
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /auth/refreshToken", data, textStatus, jqXHR);
            updateTokens(data);
            loadCards();
        });
}

function updateTokens(data) {

    console.log("Updating tokens:", data);

    // Id token
    var idToken = Cookies.getJSON("idToken");
    idToken.jwtToken = data.idToken;
    console.log("Setting new idToken:", idToken);
    Cookies.set("idToken", idToken);

    // Access token
    var accessToken = Cookies.getJSON("accessToken");
    accessToken.jwtToken = data.accessToken;
    Cookies.set("accessToken", accessToken);
}

function getHeaders(jqXHR) {
    jqXHR.setRequestHeader("Authorization", `Bearer ${getBearerToken()}`);
}

function parseJwt(token) {
    var base64Url = token.split(".")[1];
    var base64 = decodeURIComponent(
        atob(base64Url)
            .split("")
            .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
    );
    return JSON.parse(base64);
}

function getLoggedInUserId() {
    return parseJwt(getIdToken().jwtToken)["sub"];
}

function check(input, compareValue) {
    console.log("check called: ", input.value, document.getElementById(compareValue).value);
    if (input.value != document.getElementById(compareValue).value) {
        input.setCustomValidity('Password Must be Matching.');
    } else {
        // input is valid -- reset the error message
        input.setCustomValidity('');
    }
}

//#endregion

//#region Users

async function getUser(userId) {
    return await $.ajax({
        method: "GET",
        url: `${authApiBasePath}/users/${userId}`,
        dataType: "json",
        //beforeSend: getHeaders,
        cache: false
    })
        .done(async (data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /users/" + userId, data, textStatus, jqXHR);
            return data;
        });
}

async function saveUser(userId, firstName, lastName, address, city, postalCode, country, phone) {
    console.log("Saving user id:", userId);
    return await $.ajax({
        method: "PATCH",
        url: `${authApiBasePath}/users/${userId}`,
        dataType: "json",
        beforeSend: getHeaders,
        cache: false,
        data: JSON.stringify({
            given_name: firstName,
            family_name: lastName,
            address: address,
            city: city,
            postalCode: postalCode,
            country: country,
            phone: phone
        })
    })
        .done(async (data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /providers/" + userId, data, textStatus, jqXHR);
            return data;
        });
}

async function getLoggedInUser() {
    // Get cognito user info
    if (getIdToken() === undefined) {
        console.log("Token has expired");
        $(location).attr("href", "login.html");
    }
    let idToken = getIdToken().jwtToken;
    let user = parseJwt(idToken);
    console.log("User from id token:", user);
    let cognitoId = user.sub;

    // Get the servee user info too
    return await $.ajax({
        method: "GET",
        url: `${authApiBasePath}/usersByCognitoId/${cognitoId}`,
        beforeSend: getHeaders,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /usersByCognitoId/" + cognitoId, data, textStatus, jqXHR);
            Object.keys(user).forEach(key => data[key] = user[key]);
            return data;
        });
}

//#endregion

//#region Locations

async function getLocations() {
    return await $.ajax({
        method: "GET",
        url: `${locationsApiBasePath}/locations`,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /locations", data, textStatus, jqXHR);
            return data;
        });
}

//#endregion

//#region Categories

async function getCategories() {
    return await $.ajax({
        method: "GET",
        url: `${categoriesApiBasePath}/categories`,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /categories", data, textStatus, jqXHR);
            return data;
        });
}

async function getCategory(categoryId) {
    return await $.ajax({
        method: "GET",
        url: `${categoriesApiBasePath}/categories/${categoryId}`,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /categories/" + categoryId, data, textStatus, jqXHR);
            return data.name;
        });
}

//#endregion

//#region Providers

async function getProviders() {
    return await $.ajax({
        method: "GET",
        url: `${authApiBasePath}/providers`,
        dataType: "json",
        //beforeSend: getHeaders,
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /providers", data, textStatus, jqXHR);
            return data;
        });
}

async function getProvider(providerId) {
    return await $.ajax({
        method: "GET",
        url: `${authApiBasePath}/users/${providerId}`,
        contentType: "application/json",
        beforeSend: getHeaders,
        dataType: "json"
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /providers/" + providerId, data, textStatus, jqXHR);
            return data;
        });
}

//#endregion

//#region Reviews

async function createReview(reviewerId, providerId, title, comment, score) {
    await $.ajax({
        method: "POST",
        url: `${reviewsApiBasePath}/reviews`,
        beforeSend: getHeaders,
        dataType: "json",
        cache: false,
        data: JSON.stringify({
            reviewerId: reviewerId,
            providerId: providerId,
            title: title,
            comment: comment,
            score: score
        })
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("POST /reviews", data, textStatus, jqXHR);
        });

}

async function getReviews(providerId) {
    return await $.ajax({
        method: "GET",
        url: `${reviewsApiBasePath}/reviews/providers/${providerId}`,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /reviews/providers/" + providerId, data, textStatus, jqXHR);
            return data;
        });
}

async function getReviewsByUser(userId) {
    return await $.ajax({
        method: "GET",
        url: `${reviewsApiBasePath}/reviews/users/${userId}`,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /reviews/users/" + userId, data, textStatus, jqXHR);
            return data;
        });
}

//#endregion

//#region Quotes

async function getQuotesByUser(userId) {
    return await $.ajax({
        method: "GET",
        url: `${quotesApiBasePath}/quotes/users/${userId}`,
        contentType: "application/json",
        beforeSend: getHeaders,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /quotes/users/" + userId, data, textStatus, jqXHR);
            return data;
        });
}

//#endregion

//#region Geolocation

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position, showGeoError) => {
            console.log(`Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`);
            // Calculate closest location
            var closestLocation = {};
            var previousDistance = 50000;
            $.each(locations, (index, location) => {
                console.log(location);
                var distance = getDistanceFromLatLonInKm(position.coords.longitude, position.coords.latitude, parseFloat(location.long).toFixed(2), parseFloat(location.lat).toFixed(2))
                console.log("Distance to " + location.name + ": " + distance);
                if (distance < previousDistance) {
                    previousDistance = distance;
                    closestLocation = location;
                }
            });
            // Select closest location
            console.log("Closest location is:", closestLocation);
            $(`#locations option[value="${closestLocation.id}"]`).prop('selected', true);
            $('select').niceSelect('update');
        });
    } else {
        console.warning("Geolocation is not supported by this browser.");
    }
}

function doGeocode(address, postal_code, country, callback) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': address,
        'componentRestrictions': {
            'postalCode': postal_code,
            'country': country
        }
    }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            callback(results);
        } else {
            //Error handling
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}


// Calculate distance between 2 GPS coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function showGeoError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.error("An unknown error occurred.");
            break;
    }
}

//#endregion

//#region Spinner

$(document).ajaxStart(function () {
    $("#loading").removeClass('hide');
}).ajaxStop(function () {
    $("#loading").addClass('hide');
});

function showLoader() {
    $("#loading").removeClass('hide');
}

function hideLoader() {
    $("#loading").addClass('hide');
}

//#endregion

//#region Logging/Message/Error Handling

function truncateText(str, length, ending) {
    if (length == null) {
        length = 100;
    }
    if (ending == null) {
        ending = "...";
    }
    if (str.length > length) {
        return str.substring(0, length - ending.length) + ending;
    } else {
        return str;
    }
}

function logAjaxSuccess(apiFunction, data, textStatus, jqXHR) {
    console.log(apiFunction + " -> Data:", data);
    console.log(apiFunction + " -> Text Status:", textStatus);
    console.log(apiFunction + " ->  jqXHR:", jqXHR);
}

function logAjaxError(apiFunction, jqXHR, textStatus, errorThrown) {
    console.error(apiFunction + " -> jqXHR:", jqXHR);
    console.error(apiFunction + " -> Text Status:", textStatus);
    console.error(apiFunction + " -> Error Thrown:", errorThrown);
}

function showError(control, message) {
    $(control).html(message);
    $(control).show();
}

function showMessage(heading, message) {
    $.toast({
        heading: heading
        , text: message
        , position: 'top-right'
        , loaderBg: '#ff6849'
        , icon: 'info'
        , hideAfter: 3500
        , stack: 6
    })
}

function showErrorMessage(heading, message) {
    $.toast({
        heading: heading
        , text: message
        , position: 'top-right'
        , loaderBg: '#ff0000'
        , icon: 'error'
        , hideAfter: 10000
        , stack: 6
    })
}

function clearError() {
    $("#error").hide();
    $("#loginerror").hide();
    $("#registererror").hide();
}

function handleError(functionCalled, jqXHR, textStatus, errorThrown) {
    logAjaxError(functionCalled, jqXHR, textStatus, errorThrown);
    // if (jqXHR.status == 0) {
    //     // The token probably expired. Get a new one
    //     console.log("Status is 0. Trying to refresh token");
    //     refreshToken().then((tokens) => {
    //         updateTokens(tokens);
    //         functionCalled();
    //     }).catch((error) => {
    //         throw new Error(`Failed to call ${functionCalled}:" ${error}`);
    //     })
    // }
}

//#endregion

//#region URL

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

//#endregion

//#region Countries

function countriesDropdown(select2Container) {

    var isoCountries = [
        { id: '', text: '' },
        { id: 'AF', text: 'Afghanistan' },
        { id: 'AX', text: 'Aland Islands' },
        { id: 'AL', text: 'Albania' },
        { id: 'DZ', text: 'Algeria' },
        { id: 'AS', text: 'American Samoa' },
        { id: 'AD', text: 'Andorra' },
        { id: 'AO', text: 'Angola' },
        { id: 'AI', text: 'Anguilla' },
        { id: 'AQ', text: 'Antarctica' },
        { id: 'AG', text: 'Antigua And Barbuda' },
        { id: 'AR', text: 'Argentina' },
        { id: 'AM', text: 'Armenia' },
        { id: 'AW', text: 'Aruba' },
        { id: 'AU', text: 'Australia' },
        { id: 'AT', text: 'Austria' },
        { id: 'AZ', text: 'Azerbaijan' },
        { id: 'BS', text: 'Bahamas' },
        { id: 'BH', text: 'Bahrain' },
        { id: 'BD', text: 'Bangladesh' },
        { id: 'BB', text: 'Barbados' },
        { id: 'BY', text: 'Belarus' },
        { id: 'BE', text: 'Belgium' },
        { id: 'BZ', text: 'Belize' },
        { id: 'BJ', text: 'Benin' },
        { id: 'BM', text: 'Bermuda' },
        { id: 'BT', text: 'Bhutan' },
        { id: 'BO', text: 'Bolivia' },
        { id: 'BA', text: 'Bosnia And Herzegovina' },
        { id: 'BW', text: 'Botswana' },
        { id: 'BV', text: 'Bouvet Island' },
        { id: 'BR', text: 'Brazil' },
        { id: 'IO', text: 'British Indian Ocean Territory' },
        { id: 'BN', text: 'Brunei Darussalam' },
        { id: 'BG', text: 'Bulgaria' },
        { id: 'BF', text: 'Burkina Faso' },
        { id: 'BI', text: 'Burundi' },
        { id: 'KH', text: 'Cambodia' },
        { id: 'CM', text: 'Cameroon' },
        { id: 'CA', text: 'Canada' },
        { id: 'CV', text: 'Cape Verde' },
        { id: 'KY', text: 'Cayman Islands' },
        { id: 'CF', text: 'Central African Republic' },
        { id: 'TD', text: 'Chad' },
        { id: 'CL', text: 'Chile' },
        { id: 'CN', text: 'China' },
        { id: 'CX', text: 'Christmas Island' },
        { id: 'CC', text: 'Cocos (Keeling) Islands' },
        { id: 'CO', text: 'Colombia' },
        { id: 'KM', text: 'Comoros' },
        { id: 'CG', text: 'Congo' },
        { id: 'CD', text: 'Congo}, Democratic Republic' },
        { id: 'CK', text: 'Cook Islands' },
        { id: 'CR', text: 'Costa Rica' },
        { id: 'CI', text: 'Cote D\'Ivoire' },
        { id: 'HR', text: 'Croatia' },
        { id: 'CU', text: 'Cuba' },
        { id: 'CY', text: 'Cyprus' },
        { id: 'CZ', text: 'Czech Republic' },
        { id: 'DK', text: 'Denmark' },
        { id: 'DJ', text: 'Djibouti' },
        { id: 'DM', text: 'Dominica' },
        { id: 'DO', text: 'Dominican Republic' },
        { id: 'EC', text: 'Ecuador' },
        { id: 'EG', text: 'Egypt' },
        { id: 'SV', text: 'El Salvador' },
        { id: 'GQ', text: 'Equatorial Guinea' },
        { id: 'ER', text: 'Eritrea' },
        { id: 'EE', text: 'Estonia' },
        { id: 'ET', text: 'Ethiopia' },
        { id: 'FK', text: 'Falkland Islands (Malvinas)' },
        { id: 'FO', text: 'Faroe Islands' },
        { id: 'FJ', text: 'Fiji' },
        { id: 'FI', text: 'Finland' },
        { id: 'FR', text: 'France' },
        { id: 'GF', text: 'French Guiana' },
        { id: 'PF', text: 'French Polynesia' },
        { id: 'TF', text: 'French Southern Territories' },
        { id: 'GA', text: 'Gabon' },
        { id: 'GM', text: 'Gambia' },
        { id: 'GE', text: 'Georgia' },
        { id: 'DE', text: 'Germany' },
        { id: 'GH', text: 'Ghana' },
        { id: 'GI', text: 'Gibraltar' },
        { id: 'GR', text: 'Greece' },
        { id: 'GL', text: 'Greenland' },
        { id: 'GD', text: 'Grenada' },
        { id: 'GP', text: 'Guadeloupe' },
        { id: 'GU', text: 'Guam' },
        { id: 'GT', text: 'Guatemala' },
        { id: 'GG', text: 'Guernsey' },
        { id: 'GN', text: 'Guinea' },
        { id: 'GW', text: 'Guinea-Bissau' },
        { id: 'GY', text: 'Guyana' },
        { id: 'HT', text: 'Haiti' },
        { id: 'HM', text: 'Heard Island & Mcdonald Islands' },
        { id: 'VA', text: 'Holy See (Vatican City State)' },
        { id: 'HN', text: 'Honduras' },
        { id: 'HK', text: 'Hong Kong' },
        { id: 'HU', text: 'Hungary' },
        { id: 'IS', text: 'Iceland' },
        { id: 'IN', text: 'India' },
        { id: 'ID', text: 'Indonesia' },
        { id: 'IR', text: 'Iran}, Islamic Republic Of' },
        { id: 'IQ', text: 'Iraq' },
        { id: 'IE', text: 'Ireland' },
        { id: 'IM', text: 'Isle Of Man' },
        { id: 'IL', text: 'Israel' },
        { id: 'IT', text: 'Italy' },
        { id: 'JM', text: 'Jamaica' },
        { id: 'JP', text: 'Japan' },
        { id: 'JE', text: 'Jersey' },
        { id: 'JO', text: 'Jordan' },
        { id: 'KZ', text: 'Kazakhstan' },
        { id: 'KE', text: 'Kenya' },
        { id: 'KI', text: 'Kiribati' },
        { id: 'KR', text: 'Korea' },
        { id: 'KW', text: 'Kuwait' },
        { id: 'KG', text: 'Kyrgyzstan' },
        { id: 'LA', text: 'Lao People\'s Democratic Republic' },
        { id: 'LV', text: 'Latvia' },
        { id: 'LB', text: 'Lebanon' },
        { id: 'LS', text: 'Lesotho' },
        { id: 'LR', text: 'Liberia' },
        { id: 'LY', text: 'Libyan Arab Jamahiriya' },
        { id: 'LI', text: 'Liechtenstein' },
        { id: 'LT', text: 'Lithuania' },
        { id: 'LU', text: 'Luxembourg' },
        { id: 'MO', text: 'Macao' },
        { id: 'MK', text: 'Macedonia' },
        { id: 'MG', text: 'Madagascar' },
        { id: 'MW', text: 'Malawi' },
        { id: 'MY', text: 'Malaysia' },
        { id: 'MV', text: 'Maldives' },
        { id: 'ML', text: 'Mali' },
        { id: 'MT', text: 'Malta' },
        { id: 'MH', text: 'Marshall Islands' },
        { id: 'MQ', text: 'Martinique' },
        { id: 'MR', text: 'Mauritania' },
        { id: 'MU', text: 'Mauritius' },
        { id: 'YT', text: 'Mayotte' },
        { id: 'MX', text: 'Mexico' },
        { id: 'FM', text: 'Micronesia}, Federated States Of' },
        { id: 'MD', text: 'Moldova' },
        { id: 'MC', text: 'Monaco' },
        { id: 'MN', text: 'Mongolia' },
        { id: 'ME', text: 'Montenegro' },
        { id: 'MS', text: 'Montserrat' },
        { id: 'MA', text: 'Morocco' },
        { id: 'MZ', text: 'Mozambique' },
        { id: 'MM', text: 'Myanmar' },
        { id: 'NA', text: 'Namibia' },
        { id: 'NR', text: 'Nauru' },
        { id: 'NP', text: 'Nepal' },
        { id: 'NL', text: 'Netherlands' },
        { id: 'AN', text: 'Netherlands Antilles' },
        { id: 'NC', text: 'New Caledonia' },
        { id: 'NZ', text: 'New Zealand' },
        { id: 'NI', text: 'Nicaragua' },
        { id: 'NE', text: 'Niger' },
        { id: 'NG', text: 'Nigeria' },
        { id: 'NU', text: 'Niue' },
        { id: 'NF', text: 'Norfolk Island' },
        { id: 'MP', text: 'Northern Mariana Islands' },
        { id: 'NO', text: 'Norway' },
        { id: 'OM', text: 'Oman' },
        { id: 'PK', text: 'Pakistan' },
        { id: 'PW', text: 'Palau' },
        { id: 'PS', text: 'Palestinian Territory}, Occupied' },
        { id: 'PA', text: 'Panama' },
        { id: 'PG', text: 'Papua New Guinea' },
        { id: 'PY', text: 'Paraguay' },
        { id: 'PE', text: 'Peru' },
        { id: 'PH', text: 'Philippines' },
        { id: 'PN', text: 'Pitcairn' },
        { id: 'PL', text: 'Poland' },
        { id: 'PT', text: 'Portugal' },
        { id: 'PR', text: 'Puerto Rico' },
        { id: 'QA', text: 'Qatar' },
        { id: 'RE', text: 'Reunion' },
        { id: 'RO', text: 'Romania' },
        { id: 'RU', text: 'Russian Federation' },
        { id: 'RW', text: 'Rwanda' },
        { id: 'BL', text: 'Saint Barthelemy' },
        { id: 'SH', text: 'Saint Helena' },
        { id: 'KN', text: 'Saint Kitts And Nevis' },
        { id: 'LC', text: 'Saint Lucia' },
        { id: 'MF', text: 'Saint Martin' },
        { id: 'PM', text: 'Saint Pierre And Miquelon' },
        { id: 'VC', text: 'Saint Vincent And Grenadines' },
        { id: 'WS', text: 'Samoa' },
        { id: 'SM', text: 'San Marino' },
        { id: 'ST', text: 'Sao Tome And Principe' },
        { id: 'SA', text: 'Saudi Arabia' },
        { id: 'SN', text: 'Senegal' },
        { id: 'RS', text: 'Serbia' },
        { id: 'SC', text: 'Seychelles' },
        { id: 'SL', text: 'Sierra Leone' },
        { id: 'SG', text: 'Singapore' },
        { id: 'SK', text: 'Slovakia' },
        { id: 'SI', text: 'Slovenia' },
        { id: 'SB', text: 'Solomon Islands' },
        { id: 'SO', text: 'Somalia' },
        { id: 'ZA', text: 'South Africa' },
        { id: 'GS', text: 'South Georgia And Sandwich Isl.' },
        { id: 'ES', text: 'Spain' },
        { id: 'LK', text: 'Sri Lanka' },
        { id: 'SD', text: 'Sudan' },
        { id: 'SR', text: 'Suriname' },
        { id: 'SJ', text: 'Svalbard And Jan Mayen' },
        { id: 'SZ', text: 'Swaziland' },
        { id: 'SE', text: 'Sweden' },
        { id: 'CH', text: 'Switzerland' },
        { id: 'SY', text: 'Syrian Arab Republic' },
        { id: 'TW', text: 'Taiwan' },
        { id: 'TJ', text: 'Tajikistan' },
        { id: 'TZ', text: 'Tanzania' },
        { id: 'TH', text: 'Thailand' },
        { id: 'TL', text: 'Timor-Leste' },
        { id: 'TG', text: 'Togo' },
        { id: 'TK', text: 'Tokelau' },
        { id: 'TO', text: 'Tonga' },
        { id: 'TT', text: 'Trinidad And Tobago' },
        { id: 'TN', text: 'Tunisia' },
        { id: 'TR', text: 'Turkey' },
        { id: 'TM', text: 'Turkmenistan' },
        { id: 'TC', text: 'Turks And Caicos Islands' },
        { id: 'TV', text: 'Tuvalu' },
        { id: 'UG', text: 'Uganda' },
        { id: 'UA', text: 'Ukraine' },
        { id: 'AE', text: 'United Arab Emirates' },
        { id: 'GB', text: 'United Kingdom' },
        { id: 'US', text: 'United States' },
        { id: 'UM', text: 'United States Outlying Islands' },
        { id: 'UY', text: 'Uruguay' },
        { id: 'UZ', text: 'Uzbekistan' },
        { id: 'VU', text: 'Vanuatu' },
        { id: 'VE', text: 'Venezuela' },
        { id: 'VN', text: 'Viet Nam' },
        { id: 'VG', text: 'Virgin Islands, British' },
        { id: 'VI', text: 'Virgin Islands, U.S.' },
        { id: 'WF', text: 'Wallis And Futuna' },
        { id: 'EH', text: 'Western Sahara' },
        { id: 'YE', text: 'Yemen' },
        { id: 'ZM', text: 'Zambia' },
        { id: 'ZW', text: 'Zimbabwe' }
    ];

    $(select2Container).select2({
        placeholder: "Select a country",
        templateResult: formatCountry,
        data: isoCountries
    });

}

function formatCountry(country) {
    if (!country.id) { return country.text; }
    var $country = $(
        '<span class="flag-icon flag-icon-' + country.id.toLowerCase() + ' flag-icon-squared"></span>' +
        '<span class="flag-text">' + country.text + "</span>"
    );
    return $country;
};

//#endregion

//#region Logout

function logout() {
    console.log("Clicked!");
    Cookies.remove("accessToken");
    Cookies.remove("idToken");
    Cookies.remove("refreshToken");
    Cookies.remove("clockDrift");
    $(location).attr("href", "login.html");
}

//#endregion