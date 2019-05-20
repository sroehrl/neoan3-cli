# neoan3-cli
neoan3 CLI helper

### Requires
- node & npm
- composer

### Installation

```  
npm install -g neoan3-cli
```

## Starting a new neoan3 application

1. create a new folder and navigate into it

    e.g. `mkdir myApp`

    `cd myApp`

2. run neoan3 new app command

    e.g. `neoan3 new app myApp`
3. run in your local webserver

### new component
`neoan3 new component [component-name]`

This command will guide you through the creation of a new component, prefilling the controller according to your choices.
- api (generates get & post functions using a particular frame)
- route (generates init-functions resulting in the component acting as a valid route)
- custom element (currently empty class)

### new frame
`neoan3 new frame [frame-name]`

This command generates a new frame.
