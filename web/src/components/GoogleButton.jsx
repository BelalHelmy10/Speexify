import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
axios.defaults.withCredentials = true;

const API = "http://localhost:5050";

export default function GoogleButton({ onSuccess, onError, ...rest }) {
  return (
    <GoogleLogin
      onSuccess={(resp) => {
        // resp has { credential, select_by, clientId? }
        onSuccess?.({ credential: resp.credential });
      }}
      onError={(err) => onError?.(err)}
      useOneTap={false}
      {...rest}
    />
  );
}
