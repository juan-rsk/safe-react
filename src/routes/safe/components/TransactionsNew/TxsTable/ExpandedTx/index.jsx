// @flow
import React, { useState } from 'react'
import { List } from 'immutable'
import { withStyles } from '@material-ui/core/styles'
import Tabs from '@material-ui/core/Tabs'
import OpenInNew from '@material-ui/icons/OpenInNew'
import Tab from '@material-ui/core/Tab'
import Row from '~/components/layout/Row'
import Block from '~/components/layout/Block'
import Col from '~/components/layout/Col'
import Bold from '~/components/layout/Bold'
import Paragraph from '~/components/layout/Paragraph'
import Hairline from '~/components/layout/Hairline'
import { type Transaction } from '~/routes/safe/store/models/transaction'
import { type Owner } from '~/routes/safe/store/models/owner'
import { openTxInEtherScan } from '~/logic/wallets/getWeb3'
import { shortVersionOf } from '~/logic/wallets/ethAddresses'
import { styles } from './style'
import { formatDate } from '../columns'
import { secondary } from '~/theme/variables'

type Props = {
  classes: Object,
  tx: Transaction,
  threshold: number,
  owners: List<Owner>,
}

const openIconStyle = {
  height: '13px',
  color: secondary,
}

const ExpandedTx = ({
  classes, tx, threshold, owners,
}: Props) => {
  const [tabIndex, setTabIndex] = useState<number>(0)
  const confirmedLabel = `Confirmed [${tx.confirmations.size}/${threshold}]`
  const unconfirmedLabel = `Unconfirmed [${owners.size - tx.confirmations.size}]`

  const handleTabChange = (event, tabClicked) => {
    setTabIndex(tabClicked)
  }

  return (
    <Block>
      <Row>
        <Col xs={6} layout="column">
          <Block className={classes.txDataContainer}>
            <Paragraph noMargin>
              <Bold>TX hash: </Bold>
              {tx.executionTxHash ? (
                <a href={openTxInEtherScan(tx.executionTxHash, 'rinkeby')} target="_blank" rel="noopener noreferrer">
                  {shortVersionOf(tx.executionTxHash, 4)}
                  <OpenInNew style={openIconStyle} />
                </a>
              ) : (
                'n/a'
              )}
            </Paragraph>
            <Paragraph noMargin>
              <Bold>TX status: </Bold>
              {tx.executionTxHash ? 'Success' : 'Awaiting confirmations'}
            </Paragraph>
            <Paragraph noMargin>
              <Bold>TX created: </Bold>
              {formatDate(tx.submissionDate)}
            </Paragraph>
            {tx.executionDate && (
              <Paragraph noMargin>
                <Bold>TX executed: </Bold>
                {formatDate(tx.executionDate)}
              </Paragraph>
            )}
          </Block>
          <Hairline />
          <Block className={classes.txDataContainer}>
            <Paragraph noMargin>
              <Bold>Send 1.00 ETH to:</Bold>
              <br />
              {tx.recipient}
            </Paragraph>
          </Block>
        </Col>
        <Col xs={6} className={classes.rightCol}>
          <Row>
            <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="secondary" textColor="secondary">
              <Tab label={confirmedLabel} />
              <Tab label={unconfirmedLabel} />
            </Tabs>
          </Row>
        </Col>
      </Row>
    </Block>
  )
}

export default withStyles(styles)(ExpandedTx)
