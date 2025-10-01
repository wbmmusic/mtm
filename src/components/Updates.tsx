import React, { Fragment, useEffect, useState } from "react";
import { safeSend, safeReceive, safeRemoveListener } from "../helpers";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";

type DownloadSnack = { show: boolean; progress?: number };
type InstallSnack = { show: boolean; version?: string };
type RelaunchSnack = { show: boolean };

const defaultDownloadSnack: DownloadSnack = { show: false, progress: 0 };
const defaultInstallSnack: InstallSnack = { show: false, version: "x.x.x" };
const defaultRelaunchSnack: RelaunchSnack = { show: false };

export default function Updates(): React.ReactElement {
  const [downloadSnack, setDownloadSnack] =
    useState<DownloadSnack>(defaultDownloadSnack);
  const [installSnack, setInstallSnack] =
    useState<InstallSnack>(defaultInstallSnack);
  const [relaunchSnack, setRelaunchSnack] =
    useState<RelaunchSnack>(defaultRelaunchSnack);

  const handleClose = (
    event?: Event | React.SyntheticEvent,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setDownloadSnack({ show: false });
  };

  const install = () => safeSend("installUpdate");

  const closeInstallSnack = () =>
    setInstallSnack(old => ({ ...old, show: false }));

  const action = (
    <Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  const installAction = (
    <Fragment>
      <Button size="small" color="error" onClick={() => install()}>
        Relaunch App
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={closeInstallSnack}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  const relaunchAction = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={() => setRelaunchSnack(defaultRelaunchSnack)}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  useEffect(() => {
    safeSend("reactIsReady");
    safeReceive("updater", (a: unknown, b: unknown) => {
      const ev = String(a);
      if (ev === "checking-for-update") console.log("Checking For Update");
      else if (ev === "update-not-available")
        console.log("Up to date: v" + String((b as any)?.version));
      else if (ev === "update-available")
        setDownloadSnack(old => ({ show: true, progress: 0 }));
      else if (ev === "download-progress") {
        console.log("Downloading", Math.round((b as any)?.percent) + "%");
        setDownloadSnack(old => ({
          ...old,
          progress: Math.round((b as any)?.percent),
        }));
      } else if (ev === "update-downloaded") {
        console.log("Downloaded", b);
        setDownloadSnack(defaultDownloadSnack);
        setInstallSnack({ show: true, version: String((b as any)?.tag) });
      } else if (ev === "relaunching") {
        setInstallSnack(defaultInstallSnack);
        setRelaunchSnack({ show: true });
      } else if (ev === "error") console.log("Update Error", b);
      else console.log(a, b);
    });

    safeReceive("app_version", (version: unknown) => {
      safeRemoveListener("app_version");
      document.title = "MTM --- v" + String(version);
    });
    return () => safeRemoveListener("updater");
  }, []);

  return (
    <div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={!!downloadSnack.show}
        onClose={handleClose}
        message={`Downloading Update ${downloadSnack.progress ?? 0}%`}
        action={action}
      />
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={!!installSnack.show}
        onClose={handleClose}
        message={`Relaunch to install ${installSnack.version}`}
        action={installAction}
      />
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={!!relaunchSnack.show}
        message={`Relaunching ...`}
        action={relaunchAction}
      />
    </div>
  );
}
