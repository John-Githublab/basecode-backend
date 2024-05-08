function error500(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  if (err.status === 500) {
    console.log(err.status);
    res.status(500).send({
      title: "Oops! Server internal error",
    });
  }
}
function error400(req: any, res: any, next: any) {
  var err: any = new Error("Not Found");
  err.status = 404;
  res.status(404).send({
    title: `The requested URL ${req.path} was not found on this server.`,
  });
}

module.exports = {
  error500,
  error400,
};
