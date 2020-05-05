import React, { useState, useEffect, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import LinearProgress from '@material-ui/core/LinearProgress';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import {
  getUsersEmail,
  putNotification,
  getNotifications,
} from '../../logic/api';
import { classifyNotifications } from '../../logic/utils';

import { useUser } from '../UserProvider/UserProvider';
import {
  useNotifications,
  useSetNotifications,
} from '../NotificationsProvider/NotificationsProvider';

import ErrorSnackbar from '../ErrorSnackbar/ErrorSnackbar';

import Style from '../Style/Style';

const Email = ({ match }) => {
  const history = useHistory();
  const style = Style();
  const user = useUser();
  const notifications = useNotifications();
  const setNotifications = useSetNotifications();

  const [emailSent, setEmailSent] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [updateNotifications, setUpdateNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const id = match.params.userId;
  useEffect(() => {
    if (user && id && user._id === id && notifications) {
      setLoading(true);
      setError(null);
      const location = window.location;
      getUsersEmail(location)
        .then((data) => {
          if (data.errors) {
            setError('Something went wrong');
          } else {
            if (location.pathname.endsWith('send-email-confirmation-email')) {
              setEmailSent(true);
            } else {
              setEmailConfirmed(true);

              const emailNotifications = notifications.regular.filter(
                (notification) => notification.type === 'Email'
              );

              if (emailNotifications.length > 0) {
                emailNotifications.forEach((notification, index) => {
                  notification.read = true;
                  notification.readAt = new Date();

                  putNotification(user._id, notification._id, notification)
                    .then((data) => {
                      if (data.errors) {
                        setError('Something went wrong');
                      }

                      if (index === emailNotifications.length - 1) {
                        setUpdateNotifications(true);
                      }
                    })
                    .catch((error) => setError(error));
                });
              }
            }
          }
        })
        .catch((error) => setError(error))
        .finally(() => setLoading(false));
    }
  }, [user, id, notifications]);

  useEffect(() => {
    if (updateNotifications) {
      setLoading(true);
      setError(null);
      getNotifications()
        .then((data) =>
          setNotifications(classifyNotifications(data.notifications))
        )
        .catch((error) => setError(error))
        .finally(() => setLoading(false));
    }
  }, [updateNotifications, setNotifications]);

  return (
    <Fragment>
      {loading && <LinearProgress />}
      {(emailConfirmed || emailSent) && (
        <div className={style.root}>
          <Grid container direction="column" alignItems="center" spacing={2}>
            <Grid item>
              <Typography gutterBottom variant="body1">
                {emailConfirmed
                  ? `Your email ${user.email} has been confirmed!`
                  : `A confirmation email has been sent to ${user.email}`}
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={() => history.push('/')}
              >
                Take me home
              </Button>
            </Grid>
          </Grid>
        </div>
      )}
      {error && <ErrorSnackbar error={error} />}
    </Fragment>
  );
};

export default Email;
