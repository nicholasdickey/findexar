import { createMuiTheme } from '@material-ui/core/styles';
import { red } from '@material-ui/core/colors';

// Create a theme instance.
const theme = ({ mode }) => {
    //  console.log("createMuiTheme", { mode });
    let theme = createMuiTheme({

        palette: {
            primary: {
                main: '#556cd6',
            },
            secondary: {
                main: '#19857b',
            },
            error: {
                main: red.A400,
            },
            /* background: {
                 default: '#fff',
             },*/
            linkColor: mode == 1 ? red[900] : red[200],
            type: mode == 1 ? 'light' : 'dark',
        },




    })
    //  console.log("CREATED THEME", theme)
    return theme;

};

export default theme;