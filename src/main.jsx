async function getImageBase64(imageUrl) {
    var response = await fetch(document.location.origin + `/imgbase64?url=${encodeURI(imageUrl)}`)
    return await response.text()
}

const Model = ({isCheck, children}) => {
    const [activa, setActiva] = React.useState(isCheck)
    const display = children[0]
    const popup = children[1]
    const handlActiva = () => {
        console.log(activa)
        setActiva(!activa)
    }
    return (
        <div>
            <div onClick={handlActiva}>
                {display}
            </div>
            {activa ? <div style={{
                position: 'absolute',
                height: '100vh',
                width: '100vw',
                top: '0',
                left: '0',
                background: '#00000044'
            }}>
                {popup}
            </div>  : ''}
        </div>
    )

}

const TabTopDisplay = ({ name, onClose, cursor, onClick, index }) => {
    return (
        <div
            className={clsx("tab", {
                sele: cursor == index,
                nosele: !(cursor == index),
            })}
            onClick={(event) => onClick(index)}
        >
            <div className="back"></div>
            <div className="overlay">
                <div className="art">
                    <img src={`http://cravatar.eu/avatar/${name}.png`} />
                </div>
                <div className="name">
                    <span>{name}</span>
                </div>
                <div
                    className="icon"
                    onClick={(e) => {
                        onClose(name);
                        e.stopPropagation();
                    }}
                >
                    <ion-icon name="close"></ion-icon>
                </div>
            </div>
        </div>
    );
};

const BotBodyView = ({ name }) => {
    const skinRender = React.useRef();
    const ele = React.useRef()

    React.useEffect(() => {
        const {offsetWidth, offsetHeight} = ele.current
        skinRender.current = new SkinRender(
            {
                controls: {
                    enabled: true,
                    zoom: false,
                    rotate: true,
                    pan: true
                },
                canvas: {
                    width: offsetWidth,
                    height: offsetWidth * 1.65,
                },
            }, 
            ele.current
        )
    }, [])

    React.useEffect(() => {
        if (!name) return
        getImageBase64(`http://skinsystem.ely.by/skins/${name}.png`).then(
            (base64) => {
                try {
                    skinRender.current.clearScene()
                }
                catch (e) {}
                skinRender.current.render({ data: base64 }, true);
            }
        );
    }, [name]);
    return (
        <div className="bot_body_view">
            <div ref={ele} className="display"
            ></div>
        </div>
    );
};

const BorderContent = ({ children, title }) => {
    return (
        <div className="border">
            <p>{title}</p>
            <div className="content">{children}</div>
        </div>
    );
};
const TabBody = ({name}) => {
    const [json, setJson] = React.useState({})
    const bee = React.useRef();
    const tab_body = React.useRef();
    const offset = React.useRef(300);
    const isMouseDown = React.useRef(false);
    const data = React.useRef();
    const handlResize = (e) => {
        if (isMouseDown.current) {
            offset.current = tab_body.current.offsetWidth - e.clientX;
            tab_body.current.style.gridTemplateColumns = `1fr 4px ${offset.current}px`;
        }
    };

    const event = (mess) => {
        
    }

    React.useEffect(() => {

    }, [name])
    return name ? (
        <div className="tab_body" ref={tab_body} style={{ display: "grid", gridTemplateColumns: `1fr 4px ${offset.current}px`, }} onMouseMove={handlResize} onMouseUp={() => { isMouseDown.current = false; }} >
            <div className="infor_player" style={{ gridColumn: 1 }}>
                <div className="body_view">
                    {/* // TODO: */}
                    <BorderContent title={"model " + name}>
                        <BotBodyView name={name} />
                    </BorderContent>
                </div>
                <div className="infor">
                    <div className="player">
                        <BorderContent title="player infor">
                            <li>
                                <p>PLAYER NAME: </p>
                                <p>{name}</p>
                            </li>
                            <li>
                                <p>UUID: </p>
                                <p>{json.uuid}</p>
                            </li>
                            <li>
                                <p>POS:</p>
                                <p>{json.pos ? `${json.pos.x} - ${json.pos.y} - ${json.pos.z}` : '0 - 0 - 0'}</p>
                            </li>
                            <li>
                                <p>HP: </p>
                                <p>{json.hp}</p>
                            </li>
                            <li>
                                <p>FOOD: </p>
                                <p>{json.food}</p>
                            </li>
                            <li>
                                <p>TIMER JOIN: </p>
                                <p>{json.date}</p>
                            </li>
                            <li>
                                <p>COUNT DIE: </p>
                                <p>{json.die}</p>
                            </li>

                        </BorderContent>
                    </div>
                    <div className="ser">
                        <BorderContent title='server infor'>
                            <li>
                                <p>SERVER IP:</p>
                                <p>{json.ip}</p>
                            </li>
                            <li>
                                <p>PORT:</p>
                                <p>{json.pos}</p>
                            </li>
                            <li>
                                <p>PING:</p>
                                <p>{json.ping}</p>
                            </li>
                            <li>
                                <p>ONLINE: </p>
                                <p>1/20</p>
                            </li>
                        </BorderContent>
                    </div>
                </div>
                <div className="actio">
                    <BorderContent title='action'>
                        <button className="button_action">forward</button>
                        <button className="button_action">back</button>
                        <button className="button_action">jump</button>
                        <button className="button_action">left</button>
                        <button className="button_action">right</button>
                        <button className="button_action">sneak</button>
                        <button className="button_action">sprint</button>
                        <button className="button_action">use</button>
                        <button className="button_action">action</button>
                        <button className="button_action">open inventory</button>
                        <button className="button_action">chat</button>
                    </BorderContent>
                </div>
            </div>
            <div className="bee" ref={bee} onMouseDown={() => { isMouseDown.current = true; }} style={{ gridColumn: 2, gridRow: "1 / span 2" }} />
            <div className="command_server_infor" style={{ gridColumn: 3 }}>
                <div className="command">
                    <BorderContent title='script'>
                        <div className="list"></div>
                        <div className="button">
                            <button className="button_script">run</button>
                            <button className="button_script">add</button>
                            <button className="button_script">remove</button>
                        </div>
                    </BorderContent>
                </div>
                <div className="chat">
                    <BorderContent title='log'>
                        <div className="log"></div>
                    </BorderContent>
                </div>
            </div>
        </div>
    ) : '';
};

const TabMaster = ({ type }) => {
    React.useEffect(() => {
        init(({bots}) => {
            setBots(bots);
        })
    }, []);
    const [tab, setTab] = React.useState(null);
    const [bots, setBots] = React.useState([]);
    const handlTabClose = (name) => {
        console.log(name);
        const index = bots.indexOf(name);
        bots.splice(index, 1);
        setBots([...bots]);
    };
    const handlTabClick = (index) => {
        setTab(index);
    };
    const handlNewBot = () => {
        
    }
    return (
        <div className="tab_master">
            <div className="top_slie">
                {bots.map((name, index) => {
                    return (
                        <TabTopDisplay
                            key={name}
                            index={name}
                            name={name}
                            onClick={handlTabClick}
                            cursor={tab}
                            onClose={handlTabClose}
                        />
                    );
                })}
                <div className="tab_add">
                    <Model>
                        <div className="icon">
                            <ion-icon name="add"></ion-icon>
                        </div>
                        <div>
                            hello
                        </div>
                    </Model>
                </div>
            </div>
            <div className="body">
                <TabBody name={tab}/>
            </div>
        </div>
    );
};

const App = (props) => {
    return (
        <div style={{ height: "100%" }}>
            <TabMaster></TabMaster>
        </div>
    );
};

const domContainer = document.querySelector("#root");
const root = ReactDOM.createRoot(domContainer);
root.render(<App></App>);
