const authApiBasePath = "https://ommkdunauc.execute-api.eu-central-1.amazonaws.com/dev";
const categoriesApiBasePath = "https://g8335hfcy0.execute-api.eu-central-1.amazonaws.com/dev";
const locationsApiBasePath = "https://6mo2qzbcag.execute-api.eu-central-1.amazonaws.com/dev"
const providersApiBasePath = "https://sclx4kb3lk.execute-api.eu-central-1.amazonaws.com/dev";
const reviewsApiBasePath = "https://2nhq1hidx6.execute-api.eu-central-1.amazonaws.com/dev";
const quotesApiBasePath = "https://z75j3glj94.execute-api.eu-central-1.amazonaws.com/dev";
const usersApiBasePath = "https://ommkdunauc.execute-api.eu-central-1.amazonaws.com/dev";

//#region Authentication

function getBearerToken() {
    let token = Cookies.getJSON("idToken") ? Cookies.getJSON("idToken").jwtToken : undefined;
    if (!token) {
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
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /auth", data, textStatus, jqXHR);
            setTokens(data);
            return true;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            logAjaxError("GET /auth", jqXHR, textStatus, errorThrown);
            showError(textStatus);
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            logAjaxError("POST /register", jqXHR, textStatus, errorThrown);
            return jqXHR.responseJSON.message;
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            logAjaxError("POST /confirmRegistrationCode", jqXHR, textStatus, errorThrown);
            return jqXHR.responseJSON.message;
        });
}

async function isLoggedIn() {

    // Check if token is still valid
    var token = getBearerToken();

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

            $("#signin").empty();
            $("#signin").append(`       
            <nav class="site-navigation float-left">                             
                <div class="container">
                    <ul class="site-menu js-clone-nav d-none d-lg-block">
                        <li class="has-children">
                            <a href="#">${data.email}</a>
                            <ul class="dropdown">
                                <li><a href="user-profile.html">My Account</a></li>
                                <li><a href="requests.html">My Requests</a></li>
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
            handleError(isLoggedIn, jqXHR, textStatus, errorThrown);
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            logAjaxError("POST /auth/refreshToken", jqXHR, textStatus, errorThrown);
            throw new Error(errorThrown);
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
    return parseJwt(getIdToken().jwtToken)["cognito:username"];
}

//#endregion

//#region Users

async function getUserByCognitoId(cognitoId) {
    return await $.ajax({
        method: "GET",
        url: `${usersApiBasePath}/usersByCognitoId/${cognitoId}`,
        beforeSend: getHeaders,
        dataType: "json",
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /usersByCognitoId/" + cognitoId, data, textStatus, jqXHR);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(null, jqXHR, textStatus, errorThrown);
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(getLocations, jqXHR, textStatus, errorThrown);
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(getCategories, jqXHR, textStatus, errorThrown);
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(getCategory(categoryId), jqXHR, textStatus, errorThrown);
        });

}

//#endregion

//#region Providers

async function getProviders() {
    return await $.ajax({
        method: "GET",
        url: `${usersApiBasePath}/providers`,
        dataType: "json",
        beforeSend: getHeaders,
        cache: false
    })
        .done((data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /providers", data, textStatus, jqXHR);
            return data;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(getProviders, jqXHR, textStatus, errorThrown);
        });
}

async function getProvider(providerId) {
    return await $.ajax({
        method: "GET",
        url: `${usersApiBasePath}/users/${providerId}`,
        dataType: "json",
        beforeSend: getHeaders,
        cache: false
    })
        .done(async (data, textStatus, jqXHR) => {
            logAjaxSuccess("GET /providers/" + providerId, data, textStatus, jqXHR);
            return data;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(getProvider(providerId), jqXHR, textStatus, errorThrown);
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
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(createReview(title, comment), jqXHR, textStatus, errorThrown);
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
            logAjaxSuccess("GET /reviews/" + providerId, data, textStatus, jqXHR);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            handleError(getReviews(providerId), jqXHR, textStatus, errorThrown);
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

//#region Logging/Message/Error Handling

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

function showError(message) {
    $("#error").html(message);
    $("#error").show();
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

function clearError() {
    $("#error").hide();
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