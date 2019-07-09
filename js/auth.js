var cognitoUser = undefined;
var currentSession = undefined;
var accessToken = undefined;

const categoriesApiBasePath = "https://g8335hfcy0.execute-api.eu-central-1.amazonaws.com/dev";
const locationsApiBasePath = "https://6mo2qzbcag.execute-api.eu-central-1.amazonaws.com/dev";
const providersApiBasePath = "https://sclx4kb3lk.execute-api.eu-central-1.amazonaws.com/dev";

function isLoggedIn() {
    var data = {
        UserPoolId: 'eu-central-1_7iruUqdsk',
        ClientId: '3gbfhl35avtb3uop6o5scbd0sd'
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
    cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function (err, session) {
            if (err || !session.isValid()) {
                $(location).attr("href", "login.html");
                return;
            }
            console.log('session validity: ' + session.isValid());
            console.log("Session:", session);
            currentSession = session;
            accessToken = session.idToken.jwtToken;

            var parsedToken = parseJwt(accessToken);
            console.log("Parsed Token:", parsedToken);
            $("#signin").empty();
            $("#signin").append(`       
            <nav class="site-navigation float-left">                             
                <div class="container">
                    <ul class="site-menu js-clone-nav d-none d-lg-block">
                        <li class="has-children">
                            <a href="#">${parsedToken.email}</a>
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
        });
    } else {
        if (location.pathname.split('/').slice(-1)[0] != "login.html") {
            $(location).attr("href", "login.html");
        }
    }
}

function logout() {
    if (cognitoUser != null) {
        cognitoUser.signOut();
        $(location).attr("href", "login.html");
    }
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

isLoggedIn();