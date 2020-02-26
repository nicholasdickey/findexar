
import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components'
import { ServerStyleSheets } from '@material-ui/styles';
import { withTheme } from '@material-ui/core/styles';

class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const styledComponentsSheet = new ServerStyleSheet()
        const materialSheets = new ServerStyleSheets()
        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () => originalRenderPage({
                enhanceApp: App => props => styledComponentsSheet.collectStyles(materialSheets.collect(<App {...props} />))
            })
            const initialProps = await Document.getInitialProps(ctx)
            return {
                ...initialProps,
                styles: (
                    <React.Fragment>
                        {initialProps.styles}
                        {materialSheets.getStyleElement()}
                        {styledComponentsSheet.getStyleElement()}
                    </React.Fragment>
                )
            }
        } finally {
            styledComponentsSheet.seal()
        }
    }

    render() {
        const muiTheme = this.props.theme;
        const palette = muiTheme.palette;
        const backgroundColor = palette.background.default;
        const color = palette.text.primary;
        //  console.log("MUITHEME:", { muiTheme, backgroundColor, color, type: palette.type })
        return (

            <html>
                <meta name="trademark" content="Findexar: all consumer reviews fast" />


                <Head>
                    <meta charSet="utf-8" />
                    {/* Use minimum-scale=1 to enable GPU rasterization */}
                    <meta
                        name="viewport"
                        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
                    />
                    {/* PWA primary color */}
                    <meta
                        name="theme-color"
                        content={muiTheme.palette.primary.main}
                    />

                    <link href="https://fonts.googleapis.com/css?family=Asap+Condensed|Domine|Playfair+Display|Stint+Ultra+Condensed" rel="stylesheet" />
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
                    <script async defer crossOrigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2&appId=995006553995561&autoLogAppEvents=1" > </script>

                    < script async src="https://www.googletagmanager.com/gtag/js?id=UA-85541506-1" > </script>

                    < script dangerouslySetInnerHTML={{
                        __html: ` window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                      
                        gtag('config', 'UA-85541506-1');`
                    }
                    } />

                    <style>{`body { margin: 0 } /* custom! */`}</style>
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </html>
        );
    }
}
MyDocument = withTheme(MyDocument)
export default MyDocument;