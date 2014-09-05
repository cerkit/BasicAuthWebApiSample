using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Http.Headers;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Web;
using System.Configuration;

namespace WebAPISample.Modules
{
    public class BasicAuthHttpModule : IHttpModule
    {
        private const string Realm = "absc.local";

        public void Init(HttpApplication context)
        {
            // Register event handlers
            context.AuthenticateRequest += OnApplicationAuthenticateRequest;
            context.EndRequest += OnApplicationEndRequest;
        }

        private static void SetPrincipal(IPrincipal principal)
        {
            Thread.CurrentPrincipal = principal;
            if (HttpContext.Current != null)
            {
                HttpContext.Current.User = principal;
            }
        }

        // TODO: Here is where you would validate the username and password.
        private static bool CheckPassword(string username, string password)
        {
            bool validUser = false;
            
            // put your database or authentication calls here

            validUser = username == "test" && password == "test";

            return validUser;
        }

        private static bool AuthenticateUser(string credentials)
        {
            bool validated = false;
            try
            {
                var encoding = Encoding.GetEncoding("iso-8859-1");
                credentials = encoding.GetString(Convert.FromBase64String(credentials));

                int separator = credentials.IndexOf(':');
                string name = credentials.Substring(0, separator);
                string password = credentials.Substring(separator + 1);

                validated = CheckPassword(name, password);
                if (validated)
                {
                    var identity = new GenericIdentity(name);
                    SetPrincipal(new GenericPrincipal(identity, null));
                }
            }
            catch (FormatException)
            {
                // Credentials were not formatted correctly.
                validated = false;

            }
            return validated;
        }

        private static void OnApplicationAuthenticateRequest(object sender, EventArgs e)
        {
            var request = HttpContext.Current.Request;
            var authHeader = request.Headers["Authorization"];
            if (authHeader != null)
            {
                var authHeaderVal = AuthenticationHeaderValue.Parse(authHeader);

                // RFC 2617 sec 1.2, "scheme" name is case-insensitive
                if (authHeaderVal.Scheme.Equals("basic",
                        StringComparison.OrdinalIgnoreCase) &&
                    authHeaderVal.Parameter != null)
                {
                    AuthenticateUser(authHeaderVal.Parameter);
                }
            }
        }

        // If the request was unauthorized, add the WWW-Authenticate header 
        // to the response.
        private static void OnApplicationEndRequest(object sender, EventArgs e)
        {
            var response = HttpContext.Current.Response;

            // see if the request sent an X-Requested-With header (Non-Browser request - 
            // used by jQuery and Angular implementations to prevent the browser from 
            // presenting the default Login dialog)
            var request = HttpContext.Current.Request;

            string authType = "Basic";

            if (response.StatusCode == 401)
            {
                if (request.Headers.AllKeys.Contains("X-Requested-With"))
                {
                    if(request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        authType = "xBasic";
                    }
                }

                response.Headers.Add("WWW-Authenticate",
                    string.Format("{0} realm=\"{1}\"", authType, Realm));
            }
        }

        public void Dispose()
        {
        }
    }
}