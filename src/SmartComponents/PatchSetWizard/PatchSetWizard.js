
import React, { Fragment, useState, memo, useEffect } from 'react';
import propTypes from 'prop-types';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import WizardMapper from '@data-driven-forms/pf4-component-mapper/wizard';
import TextField from '@data-driven-forms/pf4-component-mapper/text-field';
import DatePicker from '@data-driven-forms/pf4-component-mapper/date-picker';
import { Modal, Wizard } from '@patternfly/react-core';
import { useDispatch } from 'react-redux';

import ConfigurationStepFields from './steps/ConfigurationStepFields';
import NameField from './InputFields/NameField';
import ToDateField from './InputFields/ToDateField';
import DescriptionField from './InputFields/DescriptionField';
import ReviewSystems from './steps/ReviewSystems';
import ReviewPatchSet from './steps/ReviewPatchSet';
import { schema, validatorMapper } from './WizardAssets';
import RequestProgress from './steps/RequestProgress';
import { usePatchSetApi } from '../../Utilities/Hooks';
import { intl } from '../../Utilities/IntlProvider';
import messages from '../../Messages';
import { fetchPatchSetAction, clearPatchSetAction, fetchPatchSetSystemsAction } from '../../store/Actions/Actions';

export const PatchSetWizard = ({ systemsIDs, setBaselineState, patchSetID }) => {
    const [wizardState, setWizardState] = useState({
        submitted: false,
        formValues: {},
        requestPending: true,
        failed: false,
        shouldRefresh: false
    });

    const dispatch = useDispatch();

    useEffect(() => {
        if (patchSetID) {
            dispatch(fetchPatchSetAction(patchSetID));
            dispatch(fetchPatchSetSystemsAction(patchSetID, { limit: -1 }));
        }

        return () => dispatch(clearPatchSetAction());
    }, []);

    const onSubmit = usePatchSetApi(wizardState, setWizardState, patchSetID);

    const handleWizardClose = () => {
        const shouldRefresh = !wizardState.failed && wizardState.submitted;

        setBaselineState({ isOpen: false, systemsIDs: [], patchSetID: undefined, shouldRefresh });
        setWizardState({ formValues: {}, submitted: false });
    };

    const mapperExtensions = {
        nameField: {
            component: NameField
        },
        descriptionField: {
            component: DescriptionField
        },
        toDateField: {
            component: ToDateField
        },
        'configuration-step': {
            component: ConfigurationStepFields,
            systemsIDs: systemsIDs || [],
            patchSetID
        },
        'review-systems': {
            component: ReviewSystems,
            systemsIDs: systemsIDs || []
        },
        'review-patch-set': {
            component: ReviewPatchSet,
            systemsIDs: systemsIDs || []
        }
    };

    return (
        <Fragment>
            {!wizardState.submitted &&  (
                <FormRenderer
                    schema={schema(patchSetID)}
                    subscription={{ values: true }}
                    FormTemplate={(props) => (
                        <Pf4FormTemplate {...props} showFormControls={false} />
                    )}
                    componentMapper={{
                        [componentTypes.WIZARD]: {
                            component: WizardMapper,
                            className: 'patch-set',
                            'data-ouia-component-id': 'patch-set-wizard'
                        },
                        [componentTypes.TEXT_FIELD]: TextField,
                        [componentTypes.DATE_PICKER]: DatePicker,
                        ...mapperExtensions
                    }}
                    validatorMapper={validatorMapper}
                    onSubmit={onSubmit}
                    onCancel={handleWizardClose} />
            ) || (
                <Modal
                    isOpen
                    variant={'large'}
                    showClose={false}
                    className="patch-set"
                    hasNoBodyWrapper
                    aria-describedby="patch-set-description"
                    aria-labelledby="patch-set-modal-title"
                >
                    <Wizard
                        className="patch-set"
                        title={intl.formatMessage(messages.patchSetTitle)}
                        description={intl.formatMessage(messages.patchSetDescription)}
                        steps={[
                            {
                                name: 'progress',
                                component: (
                                    <RequestProgress
                                        onClose={handleWizardClose}
                                        state={wizardState}
                                    />
                                ),
                                isFinishedStep: true
                            }
                        ]}
                        onClose={handleWizardClose}
                    />
                </Modal>
            )}
        </Fragment>
    );
};

PatchSetWizard.propTypes = {
    setBaselineState: propTypes.func,
    systemsIDs: propTypes.array,
    patchSetID: propTypes.string
};

export default memo(PatchSetWizard, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
});
