import { useCallback, useEffect, useState } from "react";

function App() {
  const [providerDetails, setProviderDetails] = useState({});
  const [autoConnects, setAutoConnects] = useState(
    (window.localStorage.getItem("autoConnects") || "").split(","),
  );

  const toggleRDNS = useCallback(
    (rdns) => {
      const updatedAutoConnects = autoConnects.includes(rdns)
        ? autoConnects.filter((v) => v !== rdns)
        : [...autoConnects, rdns];
      window.localStorage.setItem("autoConnects", updatedAutoConnects);
      setAutoConnects(updatedAutoConnects);
    },
    [autoConnects, setAutoConnects],
  );

  const connectProvider = useCallback(
    (providerDetail) => async () => {
      let accounts = [];
      try {
        accounts = await providerDetail.provider.request({
          method: "eth_requestAccounts",
        });
      } catch (err) {
        console.error(err);
      }

      setProviderDetails({
        ...providerDetails,
        [providerDetail.info.uuid]: {
          ...providerDetail,
          accounts,
        },
      });
    },
    [providerDetails, setProviderDetails],
  );

  useEffect(() => {
    const eventHandler = async (event) => {
      const newProviderDetail = { ...event.detail, accounts: [] };
      const {
        info: { uuid, rdns },
      } = newProviderDetail;
      if (!providerDetails[uuid]) {
        setProviderDetails({
          ...providerDetails,
          [uuid]: newProviderDetail,
        });

        if (autoConnects.includes(rdns)) {
          connectProvider(newProviderDetail)();
        }
      }
    };
    window.addEventListener("eip6963:announceProvider", eventHandler);

    return () => {
      window.removeEventListener("eip6963:announceProvider", eventHandler);
    };
  }, [providerDetails, setProviderDetails, connectProvider, autoConnects]);

  useEffect(() => {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  });

  return (
    <div>
      {Object.values(providerDetails).map((providerDetail) => (
        <div
          style={{ border: "1px solid gray", padding: 5, margin: 10 }}
          key={providerDetail.info.uuid}
        >
          <div>{providerDetail.info.name}</div>
          <div>{providerDetail.info.rdns}</div>
          <img
            width="96"
            height="96"
            src={providerDetail.info.icon}
            alt={providerDetail.info.name}
          />
          <div>
            {!providerDetail.accounts.length ? (
              <button onClick={connectProvider(providerDetail)}>Connect</button>
            ) : (
              <div>
                <div>Accounts: {providerDetail.accounts}</div>
                <label>
                  <input
                    type="checkbox"
                    checked={autoConnects.includes(providerDetail.info.rdns)}
                    onChange={() => toggleRDNS(providerDetail.info.rdns)}
                  />
                  Auto Connect
                </label>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
