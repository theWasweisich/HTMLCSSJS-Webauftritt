import express from 'express';

const userRouter = express.Router();

export default userRouter;

userRouter.get('/:username', (req, res) => {
    let usrname = req.params.username;
    const dataForUserRoute = {
        username: usrname,
    };
    res.render('user.ejs', dataForUserRoute);
});