import express from 'express';
import { DataBaseHandling } from './dataHandling';

const userRouter = express.Router();


userRouter.get("/test", (req, res) => {
    res.send("test");
})

userRouter.get('/:username', (req, res) => {
    console.warn("Username route!");
    let handler = new DataBaseHandling();
    let usrname = req.params.username;
    console.log("Hi");
    if (handler.doesUserExist(usrname) === null) {
        console.log("Hi 2");
        res.sendStatus(404);
        return
    };
    console.log("Hi 3");
    const dataForUserRoute = {
        username: usrname,
    };
    res.render('user.ejs', dataForUserRoute);
});

export default userRouter;