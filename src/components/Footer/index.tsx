import { makeStyles } from '@material-ui/core/styles'
import cn from 'classnames'
import * as React from 'react'
// import { useDispatch } from 'react-redux'

// import GnoButtonLink from 'src/components/layout/ButtonLink'
import Link from 'src/components/layout/Link'
// import { openCookieBanner } from 'src/logic/cookies/store/actions/openCookieBanner'
import { screenSm, secondary, sm } from 'src/theme/variables'

const useStyles = makeStyles({
  footer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    flexShrink: '1',
    flexWrap: 'wrap',
    justifyContent: 'center',
    margin: '0 auto',
    maxWidth: '100%',
    padding: `40px ${sm} 20px`,
    width: `${screenSm}px`,
  },
  item: {
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: '13px',
  },
  link: {
    color: secondary,
    textDecoration: 'none',

    '&:hover': {
      textDecoration: 'underline',
    },
  },
  sep: {
    color: 'rgba(0, 0, 0, 0.54)',
    margin: '0 10px',
  },
  buttonLink: {
    padding: '0',
  },
} as any)

const appVersion = process.env.REACT_APP_APP_VERSION ? `v${process.env.REACT_APP_APP_VERSION} ` : 'Versions'

const Footer = () => {
  const date = new Date()
  const classes = useStyles()
  // const dispatch = useDispatch()

  // const openCookiesHandler = () => {
  //   dispatch(openCookieBanner(true))
  // }

  return (
    <footer className={classes.footer}>
      <span className={classes.item}>©{date.getFullYear()} RSK Safe</span>
      <span className={classes.sep}>|</span>
      {/* <Link className={cn(classes.item, classes.link)} target="_blank" to="https://safe.gnosis.io/terms">
        Terms
      </Link>
      <span className={classes.sep}>|</span>
      <Link className={cn(classes.item, classes.link)} target="_blank" to="https://safe.gnosis.io/privacy">
        Privacy
      </Link>
      <span className={classes.sep}>|</span>
      <Link className={cn(classes.item, classes.link)} target="_blank" to="https://safe.gnosis.io/licenses">
        Licenses
      </Link>
      <span className={classes.sep}>|</span>
      <Link className={cn(classes.item, classes.link)} target="_blank" to="https://safe.gnosis.io/imprint">
        Imprint
      </Link>
      <span className={classes.sep}>|</span>
      <Link className={cn(classes.item, classes.link)} target="_blank" to="https://safe.gnosis.io/cookie">
        Cookie Policy
      </Link>
      <span className={classes.sep}>-</span>
      <GnoButtonLink className={cn(classes.item, classes.link, classes.buttonLink)} onClick={openCookiesHandler}>
        Preferences
      </GnoButtonLink>
      <span className={classes.sep}>|</span> */}
      <Link
        className={cn(classes.item, classes.link)}
        target="_blank"
        to="https://github.com/rsksmart/safe-react/releases"
      >
        {appVersion}
      </Link>
    </footer>
  )
}

export default Footer
