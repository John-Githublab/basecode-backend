var request = require('request');

module.exports = {
  sendFcmNotification: async function (fcmId, notification) {
    // this is to send fcm notification, start here
    var optionsFcm = {
      url: 'https://fcm.googleapis.com/fcm/send',
      method: 'POST',
      headers: {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/json',
        Authorization:
          'key=AAAA93SG2KQ:APA91bG4T6QoVnPVLfQJAC095IjJ1mlNqH6jKzzt1EZAgfg9C8NviacUJbTBDmBQ-QM0owYSrL2fPHEOinSZE6mI1JqLlWclLbAGSBbbRxmVKI_oaPQaTGXcZbvmGX5tEz13Kx5NqPDK',
      },
      body: JSON.stringify({
        notification: {
          icon:
            'https://ovaltine.s3.ap-south-1.amazonaws.com/LOGO_Ovantine-compressed.jpg',
          title: notification.title,
          body: notification.body,
          sound: 'default',
          id: Math.floor(Math.random() * 100 + 1),
        },
        data: {
          title: notification.title,
          body: notification.body,
          icon:
            'https://ovaltine.s3.ap-south-1.amazonaws.com/LOGO_Ovantine-compressed.jpg',
          poster: notification.poster,
          type: notification.type,
          sound: 'default',
          actionId: notification.actionId,
          actionTitle: notification.actionTitle,
          url: notification.url,
        },
        to: fcmId,
      }),
    };

    request(optionsFcm, function (error, response, body) {
      if (!error && response.statusCode == 200) {
      }
    });
    // end here
  },
};
